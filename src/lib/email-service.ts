// Serwis do wysyłki emaili przy eventach
import { sendEmail } from './mailer';
import * as templates from './email-templates';
import { db } from '../db';
import { reservations, participants, courses } from '../db/schema';
import { eq } from 'drizzle-orm';

// Obsługa wielu adresów admina (rozdzielonych przecinkiem)
const ADMIN_EMAILS = (import.meta.env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'biuro@adr-pomorze.pl')
  .split(',')
  .map((e: string) => e.trim())
  .filter((e: string) => e.includes('@'));

// Typy eventów mailowych
type EmailEvent = 
  | 'reservation_submitted'   // Nowe zgłoszenie (do klienta + admina)
  | 'reservation_confirmed'   // Potwierdzona rezerwacja (do klienta)
  | 'reservation_paid'        // Płatność otrzymana (do klienta)
  | 'course_reminder';        // Przypomnienie 3 dni przed (do klienta)

interface EmailResult {
  success: boolean;
  event: EmailEvent;
  recipientEmail?: string;
  error?: string;
}

// Pobierz pełne dane rezerwacji z joinami
async function getReservationData(reservationId: number) {
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
    .get();
  
  return result;
}

// Formatuj datę
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Mapuj typ kursu na czytelną nazwę
function getCourseTypeName(type: string | null): string {
  const types: Record<string, string> = {
    'podstawowy': 'Kurs podstawowy ADR',
    'cysterny': 'Kurs specjalistyczny - Cysterny',
    'klasa1': 'Kurs specjalistyczny - Klasa 1',
    'klasa7': 'Kurs specjalistyczny - Klasa 7',
    'odnowienie': 'Szkolenie odnowieniowe ADR',
  };
  return types[type || ''] || type || 'Szkolenie ADR';
}

// Główna funkcja wysyłki emaili
export async function sendEmailForEvent(
  event: EmailEvent,
  reservationId: number
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];
  
  try {
    const data = await getReservationData(reservationId);
    
    if (!data || !data.participant || !data.course) {
      return [{
        success: false,
        event,
        error: 'Nie znaleziono danych rezerwacji'
      }];
    }
    
    const { reservation, participant, course } = data;
    
    // Jeśli uczestnik nie ma emaila, nie wysyłamy
    const hasEmail = participant.email && participant.email.includes('@');
    
    const participantInfo = {
      firstName: participant.firstName,
      lastName: participant.lastName,
      phone: participant.phone,
      email: participant.email || undefined,
    };
    
    const courseInfo = {
      type: getCourseTypeName(course.courseType),
      startDate: formatDate(course.startDate),
      endDate: formatDate(course.endDate),
      location: course.location || 'Gdańsk',
      price: course.price ? Number(course.price) : undefined,
    };
    
    const reservationInfo = {
      id: reservation.id,
      paymentMethod: reservation.paymentMethod || undefined,
      needsInvoice: reservation.needsInvoice || false,
      invoiceCompany: reservation.invoiceCompany || undefined,
    };
    
    switch (event) {
      case 'reservation_submitted':
        // Email do klienta
        if (hasEmail) {
          const clientHtml = templates.reservationSubmitted(participantInfo, courseInfo, reservationInfo);
          const clientSuccess = await sendEmail({
            to: participant.email!,
            subject: `Zgłoszenie na szkolenie ADR - potwierdzenie`,
            html: clientHtml,
          });
          results.push({
            success: clientSuccess,
            event,
            recipientEmail: participant.email!,
          });
        }
        
        // Email do adminów (wszystkich)
        const adminHtml = templates.adminNewReservation(participantInfo, courseInfo, reservationInfo);
        for (const adminEmail of ADMIN_EMAILS) {
          const adminSuccess = await sendEmail({
            to: adminEmail,
            subject: `🔔 Nowe zgłoszenie: ${participant.firstName} ${participant.lastName}`,
            html: adminHtml,
          });
          results.push({
            success: adminSuccess,
            event: 'reservation_submitted',
            recipientEmail: adminEmail,
          });
        }
        break;
        
      case 'reservation_confirmed':
        if (hasEmail) {
          const html = templates.reservationConfirmed(participantInfo, courseInfo, reservationInfo);
          const success = await sendEmail({
            to: participant.email!,
            subject: `✅ Rezerwacja potwierdzona - szkolenie ADR`,
            html,
          });
          results.push({ success, event, recipientEmail: participant.email! });
        }
        break;
        
      case 'reservation_paid':
        if (hasEmail) {
          const html = templates.paymentConfirmed(participantInfo, courseInfo, reservationInfo);
          const success = await sendEmail({
            to: participant.email!,
            subject: `💚 Płatność otrzymana - szkolenie ADR`,
            html,
          });
          results.push({ success, event, recipientEmail: participant.email! });
        }
        break;
        
      case 'course_reminder':
        if (hasEmail) {
          const html = templates.courseReminder(participantInfo, courseInfo, reservationInfo);
          const success = await sendEmail({
            to: participant.email!,
            subject: `⏰ Przypomnienie - szkolenie ADR za 3 dni`,
            html,
          });
          results.push({ success, event, recipientEmail: participant.email! });
        }
        break;
    }
    
    return results;
    
  } catch (error) {
    console.error(`❌ Email service error for event ${event}:`, error);
    return [{
      success: false,
      event,
      error: error instanceof Error ? error.message : 'Unknown error'
    }];
  }
}
