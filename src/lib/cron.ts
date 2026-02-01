import cron from 'node-cron';

// Wymagane - brak fallbacku!
const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.PUBLIC_URL || 'http://localhost:4321';

let initialized = false;

/**
 * Inicjalizuje zadania cron.
 * Wywoływane raz przy starcie serwera.
 */
export function initCronJobs() {
  if (initialized) {
    console.log('[CRON] Already initialized, skipping...');
    return;
  }
  
  console.log('[CRON] Initializing cron jobs...');
  
  // Przypomnienia o kursach (jutro) - codziennie o 20:00
  cron.schedule('0 20 * * *', async () => {
    console.log('[CRON] Running: course reminders');
    try {
      const response = await fetch(`${BASE_URL}/api/cron/send-reminders?secret=${CRON_SECRET}`);
      const result = await response.json();
      console.log('[CRON] Course reminders result:', result.message || result.error);
    } catch (error) {
      console.error('[CRON] Course reminders error:', error);
    }
  }, {
    timezone: 'Europe/Warsaw'
  });
  
  // Przypomnienia o wygasających ADR - codziennie o 10:00
  cron.schedule('0 10 * * *', async () => {
    console.log('[CRON] Running: ADR expiry reminders');
    try {
      const response = await fetch(`${BASE_URL}/api/cron/adr-expiry-reminders?secret=${CRON_SECRET}`);
      const result = await response.json();
      console.log('[CRON] ADR expiry result:', result.message || result.error);
    } catch (error) {
      console.error('[CRON] ADR expiry error:', error);
    }
  }, {
    timezone: 'Europe/Warsaw'
  });
  
  initialized = true;
  console.log('[CRON] Cron jobs initialized:');
  console.log('  - Course reminders: daily at 20:00');
  console.log('  - ADR expiry reminders: daily at 10:00');
}
