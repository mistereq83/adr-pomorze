import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Kursy/Terminy szkoleń
export const courses = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseType: text('course_type').notNull(), // 'podstawowy', 'cysterny', 'klasa1', 'klasa7', 'odnowienie'
  startDate: text('start_date').notNull(),   // ISO date string
  endDate: text('end_date').notNull(),
  location: text('location').default('Gdańsk'),
  maxParticipants: integer('max_participants').default(15),
  price: real('price'),
  status: text('status').default('open'),     // 'open', 'full', 'completed', 'cancelled'
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Uczestnicy (baza kontaktów)
export const participants = sqliteTable('participants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  pesel: text('pesel'),
  birthDate: text('birth_date'),
  birthPlace: text('birth_place'),
  
  // Adres
  street: text('street'),
  city: text('city'),
  postalCode: text('postal_code'),
  
  // Kontakt
  phone: text('phone').notNull(),
  email: text('email'),
  
  // ADR
  hasCurrentAdr: integer('has_current_adr', { mode: 'boolean' }).default(false),
  currentAdrNumber: text('current_adr_number'),
  currentAdrExpiry: text('current_adr_expiry'),
  driverLicenseCategories: text('driver_license_categories'),
  
  // Meta
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at'),
});

// Rezerwacje
export const reservations = sqliteTable('reservations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseId: integer('course_id').references(() => courses.id),
  participantId: integer('participant_id').references(() => participants.id),
  
  // Status
  status: text('status').default('pending'), // 'pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show'
  
  // Płatność
  paymentMethod: text('payment_method'),      // 'przelew', 'gotowka', 'faktura'
  paymentStatus: text('payment_status').default('unpaid'), // 'unpaid', 'partial', 'paid'
  amountPaid: real('amount_paid').default(0),
  
  // Faktura
  needsInvoice: integer('needs_invoice', { mode: 'boolean' }).default(false),
  invoiceCompany: text('invoice_company'),
  invoiceNip: text('invoice_nip'),
  invoiceAddress: text('invoice_address'),
  invoiceNumber: text('invoice_number'),
  
  // Źródło
  source: text('source').default('website'),  // 'website', 'telefon', 'email', 'manual'
  
  // Zgody
  consentRules: integer('consent_rules', { mode: 'boolean' }).default(false),
  consentRodo: integer('consent_rodo', { mode: 'boolean' }).default(false),
  consentNewsletter: integer('consent_newsletter', { mode: 'boolean' }).default(false),
  
  // Meta
  notes: text('notes'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  confirmedAt: text('confirmed_at'),
  paidAt: text('paid_at'),
});

// Szablony SMS
export const smsTemplates = sqliteTable('sms_templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  event: text('event').notNull().unique(), // 'reservation_confirmed', 'reservation_paid', 'course_reminder', etc.
  name: text('name').notNull(),             // Nazwa do wyświetlenia w adminie
  template: text('template').notNull(),     // Treść z {{zmienne}}
  enabled: integer('enabled', { mode: 'boolean' }).default(true),
  updatedAt: text('updated_at'),
});

// Log wysłanych SMS
export const smsLog = sqliteTable('sms_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  templateEvent: text('template_event'),
  recipientPhone: text('recipient_phone').notNull(),
  recipientName: text('recipient_name'),
  message: text('message').notNull(),
  smsapiId: text('smsapi_id'),              // ID z SMSAPI
  status: text('status').default('pending'), // 'pending', 'sent', 'delivered', 'failed'
  errorMessage: text('error_message'),
  cost: real('cost'),                        // Koszt w punktach
  reservationId: integer('reservation_id').references(() => reservations.id),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
});

// Typy TypeScript
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type Participant = typeof participants.$inferSelect;
export type NewParticipant = typeof participants.$inferInsert;
export type Reservation = typeof reservations.$inferSelect;
export type NewReservation = typeof reservations.$inferInsert;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type SmsLog = typeof smsLog.$inferSelect;
