import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations, participants, courses } from '../../../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { sendEmailForEvent } from '../../../lib/email-service';

// GET /api/cron/send-reminders - wysyła przypomnienia 3 dni przed kursem
// Uruchamiać codziennie rano (np. przez cron w Coolify lub zewnętrzny scheduler)
export const GET: APIRoute = async ({ url, request }) => {
  // Opcjonalna autoryzacja przez header lub query param
  const authHeader = request.headers.get('Authorization');
  const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    // Znajdź datę za 3 dni
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const targetDateStr = targetDate.toISOString().split('T')[0];
    
    // Znajdź kursy zaczynające się za 3 dni
    const upcomingCourses = await db
      .select()
      .from(courses)
      .where(eq(courses.startDate, targetDateStr));
    
    if (upcomingCourses.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No courses starting in 3 days',
        remindersSent: 0 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Dla każdego kursu znajdź potwierdzone rezerwacje i wyślij przypomnienia
    const results = [];
    
    for (const course of upcomingCourses) {
      const courseReservations = await db
        .select({ reservation: reservations, participant: participants })
        .from(reservations)
        .leftJoin(participants, eq(reservations.participantId, participants.id))
        .where(
          and(
            eq(reservations.courseId, course.id),
            eq(reservations.status, 'confirmed')
          )
        );
      
      for (const { reservation, participant } of courseReservations) {
        if (participant?.email) {
          const emailResult = await sendEmailForEvent('course_reminder', reservation.id);
          results.push({
            reservationId: reservation.id,
            participant: `${participant.firstName} ${participant.lastName}`,
            email: participant.email,
            result: emailResult
          });
        }
      }
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      targetDate: targetDateStr,
      coursesFound: upcomingCourses.length,
      remindersSent: results.length,
      details: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
