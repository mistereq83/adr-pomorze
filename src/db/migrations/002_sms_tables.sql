-- Szablony SMS
CREATE TABLE IF NOT EXISTS sms_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  updated_at TEXT
);

-- Log wysłanych SMS
CREATE TABLE IF NOT EXISTS sms_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_event TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_name TEXT,
  message TEXT NOT NULL,
  smsapi_id TEXT,
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  cost REAL,
  reservation_id INTEGER REFERENCES reservations(id),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Domyślne szablony
INSERT OR IGNORE INTO sms_templates (event, name, template, enabled) VALUES
  ('reservation_confirmed', 'Potwierdzenie rezerwacji', 'Cześć {{imie}}! Twoja rezerwacja na kurs ADR ({{data}}) została potwierdzona. Czekamy na Ciebie! ADR Pomorze', 1),
  ('reservation_paid', 'Potwierdzenie płatności', '{{imie}}, dziękujemy za wpłatę za kurs ADR ({{data}}). Do zobaczenia! ADR Pomorze', 1),
  ('course_reminder', 'Przypomnienie o kursie', '{{imie}}, przypominamy: kurs ADR zaczyna się {{data}} o 8:00 w {{lokalizacja}}. ADR Pomorze', 1);
