import { defineMiddleware } from 'astro:middleware';
import { createHash } from 'crypto';

// Wymagane zmienne środowiskowe - brak fallbacków!
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('🚨 ADMIN_PASSWORD nie jest ustawione! Panel admina niedostępny.');
}

// Generuj token sesji na podstawie hasła i sekretu
export function generateSessionToken(password: string): string {
  const secret = import.meta.env.SESSION_SECRET || process.env.SESSION_SECRET || 'adr-session-2026';
  return createHash('sha256').update(`${password}:${secret}:session`).digest('hex').substring(0, 32);
}

// Waliduj token sesji
export function validateSessionToken(token: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  const validToken = generateSessionToken(ADMIN_PASSWORD);
  return token === validToken;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  
  // Sprawdź tylko dla /admin
  if (url.pathname.startsWith('/admin')) {
    // Jeśli brak hasła w env - zablokuj dostęp
    if (!ADMIN_PASSWORD) {
      if (url.pathname !== '/admin/login') {
        return context.redirect('/admin/login?error=config');
      }
    }
    
    const authCookie = context.cookies.get('admin_session');
    
    // Sprawdź czy ma poprawny token sesji
    if (!authCookie?.value || !validateSessionToken(authCookie.value)) {
      if (url.pathname !== '/admin/login') {
        return context.redirect('/admin/login');
      }
    }
  }
  
  return next();
});
