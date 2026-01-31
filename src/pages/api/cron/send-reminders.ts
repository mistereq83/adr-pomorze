import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations, participants, courses } from '../../../db/schema';
import { eq, and, gte, lte, notInArray } from 'drizzle-orm';
import { sendSmsForEvent } from '../../../lib/sms';

// Klucz do autoryzacji crona (prosty, ale skuteczny)
const CRON_SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || 'adr-reminder-cron-K8mX2pL9';

/**
 * GET /api/cron/send-reminders
 * 
 * Wysyła przypomnienia SMS do uczestników kursów rozpoczynających się jutro.
 * Wywoływać codziennie o 20:00.
 * 
 * Query params:
 * - secret: klucz autoryzacyjny
 * - dry_run=1: tylko sprawdź, nie wysyłaj
 */
export const GET: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  const dryRun = url.searchParams.get('dry_run') === '1';
  
  // Sprawdź autoryzację
  if (secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Oblicz datę jutrzejszą (YYYY-MM-DD)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Znajdź kursy zaczynające się jutro
    const coursesTomorrow = await db.select()
      .from(courses)
      .where(
        and(
          eq(courses.startDate, tomorrowStr),
          eq(courses.status, 'open')
        )
      );
    
    if (coursesTomorrow.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Brak kursów na jutro',
        date: tomorrowStr,
        sent: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const courseIds = coursesTomorrow.map(c => c.id);
    
    // Znajdź rezerwacje na te kursy (tylko potwierdzone/opłacone, nie anulowane)
    const reservationsToRemind = await db.select({
      reservation: reservations,
      participant: participants,
      course: courses,
    })
      .from(reservations)
      .leftJoin(participants, eq(reservations.participantId, participants.id))
      .leftJoin(courses, eq(reservations.courseId, courses.id))
      .where(
        and(
          // Kurs zaczyna się jutro
          eq(courses.startDate, tomorrowStr),
          // Status aktywny
          notInArray(reservations.status, ['cancelled', 'no_show', 'pending'])
        )
      );
    
    const results: Array<{
      reservationId: number;
      participant: string;
      phone: string;
      success: boolean;
      error?: string;
    }> = [];
    
    for (const r of reservationsToRemind) {
      if (!r.participant?.phone) continue;
      
      if (dryRun) {
        results.push({
          reservationId: r.reservation.id,
          participant: `${r.participant.firstName} ${r.participant.lastName}`,
          phone: r.participant.phone,
          success: true,
          error: 'DRY RUN - not sent',
        });
        continue;
      }
      
      const smsResult = await sendSmsForEvent('course_reminder', r.reservation.id);
      
      results.push({
        reservationId: r.reservation.id,
        participant: `${r.participant.firstName} ${r.participant.lastName}`,
        phone: r.participant.phone,
        success: smsResult.success,
        error: smsResult.error,
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({
      message: `Wysłano ${successCount}/${results.length} przypomnień`,
      date: tomorrowStr,
      courses: coursesTomorrow.length,
      sent: successCount,
      total: results.length,
      dryRun,
      details: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Cron error:', error);
    return new Response(JSON.stringify({ 
      error: 'Błąd wysyłania przypomnień',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
