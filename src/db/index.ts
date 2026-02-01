import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { sql } from 'drizzle-orm';

// Ścieżka do bazy danych
const DB_PATH = process.env.DATABASE_PATH || './data/adr.db';

// Upewnij się że folder istnieje
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
const dir = dirname(DB_PATH);
if (!existsSync(dir)) {
  mkdirSync(dir, { recursive: true });
}

// Połączenie z bazą
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema });

// Inicjalizacja tabel
export function initDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      location TEXT DEFAULT 'Gdańsk',
      max_participants INTEGER DEFAULT 15,
      price REAL,
      status TEXT DEFAULT 'open',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      pesel TEXT,
      birth_date TEXT,
      birth_place TEXT,
      street TEXT,
      city TEXT,
      postal_code TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      has_current_adr INTEGER DEFAULT 0,
      current_adr_number TEXT,
      current_adr_expiry TEXT,
      driver_license_categories TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id),
      participant_id INTEGER REFERENCES participants(id),
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      amount_paid REAL DEFAULT 0,
      needs_invoice INTEGER DEFAULT 0,
      invoice_company TEXT,
      invoice_nip TEXT,
      invoice_address TEXT,
      invoice_number TEXT,
      source TEXT DEFAULT 'website',
      consent_rules INTEGER DEFAULT 0,
      consent_rodo INTEGER DEFAULT 0,
      consent_newsletter INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      confirmed_at TEXT,
      paid_at TEXT
    );

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
    
    -- Tokeny do formularza uzupełniania danych
    CREATE TABLE IF NOT EXISTS completion_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT NOT NULL UNIQUE,
      reservation_id INTEGER REFERENCES reservations(id) NOT NULL,
      participant_id INTEGER REFERENCES participants(id) NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      sent_via TEXT,
      sent_at TEXT
    );
    
    -- Historia certyfikatów ADR
    CREATE TABLE IF NOT EXISTS adr_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participant_id INTEGER REFERENCES participants(id) NOT NULL,
      certificate_number TEXT,
      issue_date TEXT,
      expiry_date TEXT NOT NULL,
      classes TEXT NOT NULL,
      is_first INTEGER DEFAULT 0,
      course_id INTEGER REFERENCES courses(id),
      status TEXT DEFAULT 'active',
      reminder_6m_sent INTEGER DEFAULT 0,
      reminder_3m_sent INTEGER DEFAULT 0,
      reminder_1m_sent INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT
    );
  `);
  
  // Dodaj brakujące kolumny do reservations (ALTER TABLE)
  try {
    sqlite.exec(`ALTER TABLE reservations ADD COLUMN data_completed INTEGER DEFAULT 0`);
  } catch (e) { /* kolumna już istnieje */ }
  try {
    sqlite.exec(`ALTER TABLE reservations ADD COLUMN data_completed_at TEXT`);
  } catch (e) { /* kolumna już istnieje */ }
  
  // Dodaj domyślne szablony SMS
  sqlite.exec(`
    INSERT OR IGNORE INTO sms_templates (event, name, template, enabled) VALUES 
    ('reservation_confirmed', 'Potwierdzenie rezerwacji', 'Cześć {{imie}}! Twoja rezerwacja na kurs ADR ({{data}}) została potwierdzona. Czekamy na Ciebie! ADR Pomorze', 1),
    ('reservation_paid', 'Potwierdzenie płatności', '{{imie}}, dziękujemy za wpłatę za kurs ADR ({{data}}). Do zobaczenia! ADR Pomorze', 1),
    ('course_reminder', 'Przypomnienie o kursie', '{{imie}}, przypominamy: kurs ADR zaczyna się {{data}} o 8:00 w {{lokalizacja}}. ADR Pomorze', 1);
  `);
  
  console.log('Database initialized at:', DB_PATH);
}

// Wywołaj przy starcie
initDatabase();

// Inicjalizuj cron jobs (tylko w produkcji lub gdy wymuszono)
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
  import('../lib/cron').then(({ initCronJobs }) => {
    initCronJobs();
  }).catch(err => {
    console.error('[CRON] Failed to initialize:', err);
  });
}
