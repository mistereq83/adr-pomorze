import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations } from '../../../db/schema';
import { findOrCreateParticipant } from '../../../lib/participants';
import { sendEmailForEvent } from '../../../lib/email-service';
import { sendSmsForEvent, sendAdminNotificationSms } from '../../../lib/sms';

// POST /api/reservations/bulk - rezerwacja na wiele szkoleń naraz
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Walidacja
    if (!data.name || !data.phone || !data.email) {
      return new Response(JSON.stringify({ error: 'Imię, telefon i email są wymagane' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!data.courses || data.courses.length === 0) {
      return new Response(JSON.stringify({ error: 'Wybierz co najmniej jedno szkolenie' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Rozdziel imię i nazwisko
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';
    
    // Znajdź lub utwórz uczestnika (deduplikacja po PESEL/telefon/email)
    const result = await findOrCreateParticipant({
      firstName,
      lastName,
      phone: data.phone,
      email: data.email,
      notes: data.notes || null,
    });
    
    const participantId = result.participant.id;
    
    // Stwórz rezerwacje dla każdego kursu
    const createdReservations = [];
    
    for (const course of data.courses) {
      const courseDetails = `${course.type} (${course.date})${course.note ? ` - ${course.note}` : ''} - ${course.price} zł`;
      
      const reservation = await db.insert(reservations).values({
        courseId: parseInt(course.id) || null,
        participantId: participantId,
        status: 'pending',
        paymentStatus: 'unpaid',
        source: 'website',
        notes: courseDetails,
        createdAt: new Date().toISOString(),
      }).returning();
      
      createdReservations.push(reservation[0]);
      
      // Wyślij powiadomienia dla każdej rezerwacji
      try {
        // Email do klienta + adminów
        await sendEmailForEvent('reservation_submitted', reservation[0].id);
        // SMS do klienta
        await sendSmsForEvent('reservation_submitted', reservation[0].id);
        // SMS do admina
        await sendAdminNotificationSms(reservation[0].id);
      } catch (notifyError) {
        console.error('Notification error (non-blocking):', notifyError);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      participant: result.participant,
      participantIsNew: result.isNew,
      participantMatched: result.matched,
      fieldsUpdated: result.fieldsUpdated,
      reservations: createdReservations,
      message: result.isNew 
        ? `Nowy uczestnik + ${createdReservations.length} rezerwacji`
        : `Istniejący uczestnik (${result.matched}) + ${createdReservations.length} rezerwacji`
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating bulk reservation:', error);
    return new Response(JSON.stringify({ 
      error: 'Błąd tworzenia rezerwacji',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
