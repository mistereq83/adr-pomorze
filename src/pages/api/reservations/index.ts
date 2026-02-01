import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations, participants, courses } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { validateAndNormalizePhone } from '../../../lib/phone';
import { findOrCreateParticipant } from '../../../lib/participants';
import { sendEmailForEvent } from '../../../lib/email-service';
import { sendSmsForEvent } from '../../../lib/sms';
import { notifyNewReservation } from '../../../lib/sse';

// GET /api/reservations - lista rezerwacji z joinami
export const GET: APIRoute = async ({ url }) => {
  try {
    const courseId = url.searchParams.get('courseId');
    const status = url.searchParams.get('status');
    
    // Pobierz rezerwacje z danymi uczestnika i kursu
    const result = await db
      .select({
        reservation: reservations,
        participant: participants,
        course: courses,
      })
      .from(reservations)
      .leftJoin(participants, eq(reservations.participantId, participants.id))
      .leftJoin(courses, eq(reservations.courseId, courses.id))
      .orderBy(desc(reservations.createdAt));
    
    // Filtruj po stronie aplikacji (prostsze)
    let filtered = result;
    if (courseId) {
      filtered = filtered.filter(r => r.reservation.courseId === parseInt(courseId));
    }
    if (status) {
      filtered = filtered.filter(r => r.reservation.status === status);
    }
    
    return new Response(JSON.stringify(filtered), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania rezerwacji' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/reservations - nowa rezerwacja
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Jeśli nie ma participantId, najpierw stwórz uczestnika
    let participantId = data.participantId;
    
    if (!participantId && data.participant) {
      // Walidacja numeru telefonu
      const normalizedPhone = validateAndNormalizePhone(data.participant.phone);
      if (!normalizedPhone) {
        return new Response(JSON.stringify({ 
          error: 'Nieprawidłowy numer telefonu. Podaj 9-cyfrowy polski numer komórkowy.' 
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Deduplikacja: znajdź lub utwórz uczestnika
      const result = await findOrCreateParticipant({
        firstName: data.participant.firstName,
        lastName: data.participant.lastName,
        phone: normalizedPhone,
        email: data.participant.email || '',
        pesel: data.participant.pesel,
        hasCurrentAdr: data.participant.hasCurrentAdr || false,
        currentAdrNumber: data.participant.currentAdrNumber,
      });
      
      participantId = result.participant.id;
    }
    
    // Stwórz rezerwację
    const result = await db.insert(reservations).values({
      courseId: data.courseId,
      participantId: participantId,
      status: data.status || 'pending',
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus || 'unpaid',
      needsInvoice: data.needsInvoice || false,
      invoiceCompany: data.invoiceCompany,
      invoiceNip: data.invoiceNip,
      invoiceAddress: data.invoiceAddress,
      source: data.source || 'website',
      consentRules: data.consentRules || false,
      consentRodo: data.consentRodo || false,
      consentNewsletter: data.consentNewsletter || false,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    }).returning();
    
    // Wyślij emaile (do klienta i admina) + SMS
    let emailResult = null;
    let smsResult = null;
    try {
      emailResult = await sendEmailForEvent('reservation_submitted', result[0].id);
    } catch (emailError) {
      console.error('Email send failed (non-blocking):', emailError);
    }
    try {
      smsResult = await sendSmsForEvent('reservation_submitted', result[0].id);
    } catch (smsError) {
      console.error('SMS send failed (non-blocking):', smsError);
    }
    
    // Powiadom podłączone dashboardy przez SSE
    try {
      const participant = await db.select().from(participants).where(eq(participants.id, participantId)).get();
      const course = data.courseId ? await db.select().from(courses).where(eq(courses.id, data.courseId)).get() : null;
      
      notifyNewReservation({
        id: result[0].id,
        participantName: participant ? `${participant.firstName} ${participant.lastName}` : 'Nieznany',
        courseType: course?.courseType || 'Nieznany',
        createdAt: result[0].createdAt || new Date().toISOString(),
      });
    } catch (sseError) {
      console.error('SSE notification failed (non-blocking):', sseError);
    }
    
    return new Response(JSON.stringify({ ...result[0], emailResult, smsResult }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating reservation:', error);
    return new Response(JSON.stringify({ error: 'Błąd tworzenia rezerwacji' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
