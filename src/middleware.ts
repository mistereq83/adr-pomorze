import { defineMiddleware } from 'astro:middleware';

const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD || 'adr2026admin';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  
  // Sprawdź tylko dla /admin
  if (url.pathname.startsWith('/admin')) {
    const authCookie = context.cookies.get('admin_auth');
    
    // Sprawdź czy ma poprawne cookie
    if (authCookie?.value !== ADMIN_PASSWORD) {
      // Przekieruj do logowania jeśli nie jest zalogowany
      if (url.pathname !== '/admin/login') {
        return context.redirect('/admin/login');
      }
    }
  }
  
  return next();
});
