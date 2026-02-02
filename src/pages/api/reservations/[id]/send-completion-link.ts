import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { reservations, participants, completionTokens, courses } from '../../../../db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { sendSms } from '../../../../lib/sms';
import { sendEmail } from '../../../../lib/mailer';
import { dataCompletionReminder } from '../../../../lib/email-templates';

const PUBLIC_URL = process.env.PUBLIC_URL || 'https://adr.apps.ekolan.pl';

/**
 * POST /api/reservations/:id/send-completion-link
 * 
 * Generuje unikalny token i wysyła link do uzupełnienia danych.
 * Można wywołać wielokrotnie (generuje nowy token, stary wygasa).
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const reservationId = parseInt(params.id!);
    const body = await request.json().catch(() => ({}));
    const sendVia = body.sendVia || 'sms'; // 'sms', 'email', 'both'
    
    // Pobierz rezerwację z uczestnikiem i kursem
    const result = await db
      .select({
        reservation: reservations,
        participant: participants,
        course: courses,
      })
      .from(reservations)
      .leftJoin(participants, eq(reservations.participantId, participants.id))
      .leftJoin(courses, eq(reservations.courseId, courses.id))
      .where(eq(reservations.id, reservationId))
      .limit(1);
    
    if (result.length === 0 || !result[0].participant) {
      return new Response(JSON.stringify({ error: 'Rezerwacja nie znaleziona' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const { reservation, participant, course } = result[0];
    
    // Oznacz stare tokeny jako wygasłe
    await db.update(completionTokens)
      .set({ status: 'expired' })
      .where(eq(completionTokens.reservationId, reservationId));
    
    // Generuj nowy token (32 znaki hex)
    const token = randomBytes(16).toString('hex');
    
    // Data wygaśnięcia: 7 dni
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Zapisz token
    const newToken = await db.insert(completionTokens).values({
      token,
      reservationId,
      participantId: participant.id,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      sentVia: sendVia,
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }).returning();
    
    const completionUrl = `${PUBLIC_URL}/uzupelnij-dane/${token}`;
    
    // Wyślij SMS i/lub Email
    let smsSent = false;
    let emailSent = false;
    
    if ((sendVia === 'sms' || sendVia === 'both') && participant.phone) {
      const smsText = `${participant.firstName}, uzupełnij dane do szkolenia ADR: ${completionUrl} (link ważny 7 dni)`;
      const smsResult = await sendSms(participant.phone, smsText, `${participant.firstName} ${participant.lastName}`);
      smsSent = smsResult.success;
    }
    
    // Wysyłka email
    if ((sendVia === 'email' || sendVia === 'both') && participant.email && participant.email.includes('@')) {
      try {
        // Mapuj typ kursu
        const courseTypes: Record<string, string> = {
          'podstawowy': 'Kurs podstawowy ADR',
          'cysterny': 'Kurs specjalistyczny - Cysterny',
          'klasa1': 'Kurs specjalistyczny - Klasa 1',
          'klasa7': 'Kurs specjalistyczny - Klasa 7',
          'odnowienie': 'Szkolenie odnowieniowe ADR',
        };
        
        const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pl-PL') : '---';
        
        const emailHtml = dataCompletionReminder(
          {
            firstName: participant.firstName,
            lastName: participant.lastName,
            phone: participant.phone,
            email: participant.email,
          },
          {
            type: courseTypes[course?.courseType || ''] || course?.courseType || 'Szkolenie ADR',
            startDate: formatDate(course?.startDate || null),
            endDate: formatDate(course?.endDate || null),
          },
          completionUrl
        );
        
        emailSent = await sendEmail({
          to: participant.email,
          subject: '📝 Uzupełnij dane do szkolenia ADR',
          html: emailHtml,
        });
      } catch (e) {
        console.error('Error sending completion email:', e);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      token: newToken[0],
      url: completionUrl,
      sent: {
        sms: smsSent,
        email: emailSent,
      },
      expiresAt: expiresAt.toISOString(),
      message: `Link wysłany${smsSent ? ' SMS' : ''}${emailSent ? ' email' : ''}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error sending completion link:', error);
    return new Response(JSON.stringify({ 
      error: 'Błąd wysyłania linku',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
