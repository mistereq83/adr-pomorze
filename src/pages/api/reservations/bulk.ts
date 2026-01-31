import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations, participants } from '../../../db/schema';

// POST /api/reservations/bulk - rezerwacja na wiele szkoleń naraz
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Walidacja
    if (!data.name || !data.phone) {
      return new Response(JSON.stringify({ error: 'Imię i telefon są wymagane' }), {
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
    
    // Stwórz uczestnika
    const newParticipant = await db.insert(participants).values({
      firstName,
      lastName,
      phone: data.phone.replace(/\s/g, ''),
      email: data.email || null,
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
    }).returning();
    
    const participantId = newParticipant[0].id;
    
    // Stwórz rezerwacje dla każdego kursu
    const createdReservations = [];
    
    for (const course of data.courses) {
      // Utwórz szczegóły w notes (bo kursy mogą nie być jeszcze w bazie)
      const courseDetails = `${course.type} (${course.date})${course.note ? ` - ${course.note}` : ''} - ${course.price} zł`;
      
      const reservation = await db.insert(reservations).values({
        courseId: course.dbId || null, // jeśli mamy ID z bazy
        participantId: participantId,
        status: 'pending',
        paymentStatus: 'unpaid',
        source: 'website',
        notes: courseDetails,
        createdAt: new Date().toISOString(),
      }).returning();
      
      createdReservations.push(reservation[0]);
    }
    
    return new Response(JSON.stringify({
      success: true,
      participant: newParticipant[0],
      reservations: createdReservations,
      message: `Utworzono ${createdReservations.length} rezerwacji`
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
