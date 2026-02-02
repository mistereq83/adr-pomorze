// Szablony emaili dla ADR Pomorze

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #1e3a5f; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
  .info-box { background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
  .info-label { font-weight: 600; color: #6b7280; min-width: 140px; }
  .info-value { color: #111827; }
  .highlight { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 14px; color: #6b7280; border-radius: 0 0 8px 8px; }
  .button { display: inline-block; background: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
`;

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>
  `.trim();
}

interface CourseInfo {
  type: string;
  startDate: string;
  endDate: string;
}

interface ParticipantInfo {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

interface ReservationInfo {
  id: number;
  paymentMethod?: string;
  needsInvoice?: boolean;
  invoiceCompany?: string;
}

// 1. Potwierdzenie zgłoszenia (zaraz po wysłaniu formularza)
export function reservationSubmitted(
  participant: ParticipantInfo,
  course: CourseInfo,
  reservation: ReservationInfo
): string {
  return wrapTemplate(`
    <div class="header">
      <h1>🚛 ADR Pomorze</h1>
    </div>
    <div class="content">
      <h2>Dziękujemy za zgłoszenie!</h2>
      <p>Cześć <strong>${participant.firstName}</strong>,</p>
      <p>Otrzymaliśmy Twoje zgłoszenie na szkolenie ADR. Poniżej szczegóły:</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Szczegóły szkolenia</h3>
        <div class="info-row"><span class="info-label">Typ kursu:</span><span class="info-value">${course.type}</span></div>
        <div class="info-row"><span class="info-label">Termin:</span><span class="info-value">${course.startDate} - ${course.endDate}</span></div>
      </div>
      
      <div class="highlight">
        <strong>⏳ Co dalej?</strong><br>
        Twoje zgłoszenie zostanie zweryfikowane przez nasz zespół. 
        Otrzymasz email z potwierdzeniem rezerwacji w ciągu 24 godzin.
      </div>
      
      <p>Numer zgłoszenia: <strong>#${reservation.id}</strong></p>
      
      <p>W razie pytań zadzwoń: <strong>58 301 15 15</strong></p>
    </div>
    <div class="footer">
      <p>ADR Pomorze - Szkolenia ADR w Trójmieście</p>
      <p>ul. Przykładowa 10, 80-000 Gdańsk</p>
    </div>
  `);
}

// 2. Potwierdzenie rezerwacji (po akceptacji przez admina)
export function reservationConfirmed(
  participant: ParticipantInfo,
  course: CourseInfo,
  reservation: ReservationInfo
): string {
  return wrapTemplate(`
    <div class="header">
      <h1>✅ Rezerwacja potwierdzona!</h1>
    </div>
    <div class="content">
      <h2>Witaj ${participant.firstName}!</h2>
      <p>Twoja rezerwacja została <strong>potwierdzona</strong>. Czekamy na Ciebie!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Szczegóły szkolenia</h3>
        <div class="info-row"><span class="info-label">Typ kursu:</span><span class="info-value">${course.type}</span></div>
        <div class="info-row"><span class="info-label">Termin:</span><span class="info-value">${course.startDate} - ${course.endDate}</span></div>
        <div class="info-row"><span class="info-label">Nr rezerwacji:</span><span class="info-value">#${reservation.id}</span></div>
      </div>
      
      <div class="highlight">
        <strong>📝 Co zabrać na szkolenie:</strong><br>
        • Dowód osobisty<br>
        • Prawo jazdy<br>
        • Aktualne zaświadczenie ADR (jeśli posiadasz)
      </div>
      
      <p>Do zobaczenia na szkoleniu!</p>
    </div>
    <div class="footer">
      <p>ADR Pomorze - Szkolenia ADR w Trójmieście</p>
      <p>Telefon: 58 301 15 15</p>
    </div>
  `);
}

// 3. Przypomnienie (3 dni przed szkoleniem)
export function courseReminder(
  participant: ParticipantInfo,
  course: CourseInfo,
  reservation: ReservationInfo
): string {
  return wrapTemplate(`
    <div class="header">
      <h1>⏰ Przypomnienie o szkoleniu</h1>
    </div>
    <div class="content">
      <h2>Cześć ${participant.firstName}!</h2>
      <p>Przypominamy, że za <strong>3 dni</strong> rozpoczyna się Twoje szkolenie ADR.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Szczegóły</h3>
        <div class="info-row"><span class="info-label">Typ kursu:</span><span class="info-value">${course.type}</span></div>
        <div class="info-row"><span class="info-label">Data rozpoczęcia:</span><span class="info-value"><strong>${course.startDate}</strong></span></div>
      </div>
      
      <div class="highlight">
        <strong>📝 Pamiętaj, żeby zabrać:</strong><br>
        • Dowód osobisty<br>
        • Prawo jazdy<br>
        • Aktualne zaświadczenie ADR (jeśli posiadasz)<br>
        • Długopis
      </div>
      
      <p>Szkolenie zaczyna się o godzinie <strong>8:00</strong>. Prosimy o punktualne przybycie.</p>
      
      <p>W razie pytań: <strong>58 301 15 15</strong></p>
    </div>
    <div class="footer">
      <p>ADR Pomorze - Szkolenia ADR w Trójmieście</p>
    </div>
  `);
}

// 4. Powiadomienie dla admina o nowym zgłoszeniu
export function adminNewReservation(
  participant: ParticipantInfo,
  course: CourseInfo,
  reservation: ReservationInfo
): string {
  return wrapTemplate(`
    <div class="header" style="background: #059669;">
      <h1>🔔 Nowe zgłoszenie!</h1>
    </div>
    <div class="content">
      <h2>Nowa rezerwacja w systemie</h2>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">👤 Dane uczestnika</h3>
        <div class="info-row"><span class="info-label">Imię i nazwisko:</span><span class="info-value"><strong>${participant.firstName} ${participant.lastName}</strong></span></div>
        <div class="info-row"><span class="info-label">Telefon:</span><span class="info-value">${participant.phone}</span></div>
        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${participant.email || 'brak'}</span></div>
      </div>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Szkolenie</h3>
        <div class="info-row"><span class="info-label">Typ kursu:</span><span class="info-value">${course.type}</span></div>
        <div class="info-row"><span class="info-label">Termin:</span><span class="info-value">${course.startDate} - ${course.endDate}</span></div>
        ${reservation.needsInvoice ? `<div class="info-row"><span class="info-label">Faktura:</span><span class="info-value">${reservation.invoiceCompany || 'TAK'}</span></div>` : ''}
      </div>
      
      <p style="text-align: center;">
        <a href="https://adr-pomorze.pl/admin/reservations/${reservation.id}" class="button">
          Zobacz w panelu →
        </a>
      </p>
    </div>
    <div class="footer">
      <p>System rezerwacji ADR Pomorze</p>
    </div>
  `);
}

// 5. Potwierdzenie płatności
export function paymentConfirmed(
  participant: ParticipantInfo,
  course: CourseInfo,
  reservation: ReservationInfo
): string {
  return wrapTemplate(`
    <div class="header" style="background: #059669;">
      <h1>💚 Płatność otrzymana!</h1>
    </div>
    <div class="content">
      <h2>Dziękujemy za wpłatę, ${participant.firstName}!</h2>
      <p>Potwierdzamy otrzymanie płatności za szkolenie ADR.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0;">📋 Szczegóły</h3>
        <div class="info-row"><span class="info-label">Typ kursu:</span><span class="info-value">${course.type}</span></div>
        <div class="info-row"><span class="info-label">Termin:</span><span class="info-value">${course.startDate} - ${course.endDate}</span></div>
        <div class="info-row"><span class="info-label">Nr rezerwacji:</span><span class="info-value">#${reservation.id}</span></div>
        <div class="info-row"><span class="info-label">Status:</span><span class="info-value" style="color: #059669;"><strong>✅ Opłacone</strong></span></div>
      </div>
      
      <p>Do zobaczenia na szkoleniu!</p>
    </div>
    <div class="footer">
      <p>ADR Pomorze - Szkolenia ADR w Trójmieście</p>
      <p>Telefon: 58 301 15 15</p>
    </div>
  `);
}
