// SMSAPI Integration for ADR Pomorze
import { db } from '../db';
import { smsTemplates, smsLog, participants, courses, reservations, settings } from '../db/schema';
import { eq } from 'drizzle-orm';

const SMSAPI_TOKEN = import.meta.env.SMSAPI_TOKEN || process.env.SMSAPI_TOKEN || '';
const SMSAPI_SENDER = import.meta.env.SMSAPI_SENDER || process.env.SMSAPI_SENDER || 'ADR';
const SMSAPI_URL = 'https://api.smsapi.pl/sms.do';

interface SmsResult {
  success: boolean;
  smsapiId?: string;
  cost?: number;
  error?: string;
}

// Wysyłka SMS przez SMSAPI
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  // Normalizuj numer telefonu (usuń spacje, dodaj prefix 48)
  let normalizedPhone = phone.replace(/\s+/g, '').replace(/^(\+48|0048)/, '');
  if (!normalizedPhone.startsWith('48') && normalizedPhone.length === 9) {
    normalizedPhone = '48' + normalizedPhone;
  }

  try {
    const params = new URLSearchParams({
      to: normalizedPhone,
      from: SMSAPI_SENDER,
      message: message,
      format: 'json',
      encoding: 'utf-8',
    });

    const response = await fetch(SMSAPI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SMSAPI_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (data.error) {
      return {
        success: false,
        error: `SMSAPI Error ${data.error}: ${data.message}`,
      };
    }

    if (data.list && data.list[0]) {
      return {
        success: true,
        smsapiId: data.list[0].id,
        cost: data.list[0].points,
      };
    }

    return { success: false, error: 'Unknown response from SMSAPI' };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// Zastąp zmienne w szablonie
export function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
  }
  return result;
}

// Wyślij SMS na podstawie eventu
export async function sendSmsForEvent(
  event: string,
  reservationId: number
): Promise<SmsResult & { sent: boolean }> {
  // Pobierz szablon
  const template = await db.select()
    .from(smsTemplates)
    .where(eq(smsTemplates.event, event))
    .get();

  if (!template || !template.enabled) {
    return { success: false, sent: false, error: 'Template not found or disabled' };
  }

  // Pobierz dane rezerwacji z uczestnikiem i kursem
  const reservation = await db.select({
    reservation: reservations,
    participant: participants,
    course: courses,
  })
    .from(reservations)
    .leftJoin(participants, eq(reservations.participantId, participants.id))
    .leftJoin(courses, eq(reservations.courseId, courses.id))
    .where(eq(reservations.id, reservationId))
    .get();

  if (!reservation || !reservation.participant) {
    return { success: false, sent: false, error: 'Reservation or participant not found' };
  }

  const { participant, course } = reservation;

  if (!participant.phone) {
    return { success: false, sent: false, error: 'No phone number' };
  }

  // Przygotuj zmienne
  const variables: Record<string, string> = {
    imie: participant.firstName,
    nazwisko: participant.lastName,
    telefon: participant.phone,
    email: participant.email || '',
    kurs: course?.courseType || '',
    data: course?.startDate ? new Date(course.startDate).toLocaleDateString('pl-PL') : '',
    data_koniec: course?.endDate ? new Date(course.endDate).toLocaleDateString('pl-PL') : '',
  };

  // Parsuj szablon
  const message = parseTemplate(template.template, variables);

  // Wyślij SMS
  const result = await sendSms(participant.phone, message);

  // Zapisz do logu
  await db.insert(smsLog).values({
    templateEvent: event,
    recipientPhone: participant.phone,
    recipientName: `${participant.firstName} ${participant.lastName}`,
    message: message,
    smsapiId: result.smsapiId || null,
    status: result.success ? 'sent' : 'failed',
    errorMessage: result.error || null,
    cost: result.cost || null,
    reservationId: reservationId,
    createdAt: new Date().toISOString(),
  });

  return { ...result, sent: true };
}

// Wyślij SMS do admina przy nowej rezerwacji
export async function sendAdminNotificationSms(reservationId: number): Promise<SmsResult & { sent: boolean }> {
  // Pobierz numer telefonu admina z ustawień
  const adminPhoneSetting = await db.select()
    .from(settings)
    .where(eq(settings.key, 'admin_phone'))
    .get();
  
  const adminPhone = adminPhoneSetting?.value;
  if (!adminPhone) {
    return { success: false, sent: false, error: 'Admin phone not configured' };
  }
  
  // Pobierz szablon
  const template = await db.select()
    .from(smsTemplates)
    .where(eq(smsTemplates.event, 'admin_new_reservation'))
    .get();

  if (!template || !template.enabled) {
    return { success: false, sent: false, error: 'Admin template not found or disabled' };
  }

  // Pobierz dane rezerwacji
  const reservation = await db.select({
    reservation: reservations,
    participant: participants,
    course: courses,
  })
    .from(reservations)
    .leftJoin(participants, eq(reservations.participantId, participants.id))
    .leftJoin(courses, eq(reservations.courseId, courses.id))
    .where(eq(reservations.id, reservationId))
    .get();

  if (!reservation || !reservation.participant) {
    return { success: false, sent: false, error: 'Reservation not found' };
  }

  const { participant, course } = reservation;

  const variables: Record<string, string> = {
    imie: participant.firstName,
    nazwisko: participant.lastName,
    telefon: participant.phone,
    email: participant.email || '',
    kurs: course?.courseType || '',
    data: course?.startDate ? new Date(course.startDate).toLocaleDateString('pl-PL') : '',
  };

  const message = parseTemplate(template.template, variables);
  const result = await sendSms(adminPhone, message);

  // Zapisz do logu
  await db.insert(smsLog).values({
    templateEvent: 'admin_new_reservation',
    recipientPhone: adminPhone,
    recipientName: 'Administrator',
    message: message,
    smsapiId: result.smsapiId || null,
    status: result.success ? 'sent' : 'failed',
    errorMessage: result.error || null,
    cost: result.cost || null,
    reservationId: reservationId,
    createdAt: new Date().toISOString(),
  });

  return { ...result, sent: true };
}

// Inicjalizuj domyślne szablony
export async function initDefaultTemplates() {
  const defaults = [
    {
      event: 'reservation_submitted',
      name: 'Nowe zgłoszenie',
      template: 'Cześć {{imie}}! Dziękujemy za zgłoszenie na kurs ADR ({{data}}). Potwierdzimy rezerwację wkrótce. ADR Pomorze',
    },
    {
      event: 'reservation_confirmed',
      name: 'Potwierdzenie rezerwacji',
      template: 'Cześć {{imie}}! Twoja rezerwacja na kurs ADR ({{data}}) została potwierdzona. Czekamy na Ciebie! ADR Pomorze',
    },
    {
      event: 'reservation_paid',
      name: 'Potwierdzenie płatności',
      template: '{{imie}}, dziękujemy za wpłatę za kurs ADR ({{data}}). Do zobaczenia! ADR Pomorze',
    },
    {
      event: 'course_reminder',
      name: 'Przypomnienie o kursie',
      template: '{{imie}}, przypominamy: kurs ADR zaczyna się {{data}} o 8:00. ADR Pomorze',
    },
    {
      event: 'admin_new_reservation',
      name: 'Powiadomienie admina - nowe zgłoszenie',
      template: 'Nowe zgłoszenie! {{imie}} {{nazwisko}} ({{telefon}}) - {{kurs}} {{data}}. Sprawdź panel.',
    },
  ];

  for (const t of defaults) {
    const existing = await db.select().from(smsTemplates).where(eq(smsTemplates.event, t.event)).get();
    if (!existing) {
      await db.insert(smsTemplates).values(t);
    }
  }
}
