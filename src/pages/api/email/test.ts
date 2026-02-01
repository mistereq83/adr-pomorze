import type { APIRoute } from 'astro';
import { testConnection, sendEmail } from '../../../lib/mailer';

// GET /api/email/test - test połączenia SMTP
export const GET: APIRoute = async ({ url }) => {
  try {
    const connectionOk = await testConnection();
    
    if (!connectionOk) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'SMTP connection failed. Check credentials.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'SMTP connection verified' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/email/test - wyślij testowego maila
export const POST: APIRoute = async ({ request }) => {
  try {
    const { to } = await request.json();
    
    if (!to) {
      return new Response(JSON.stringify({ error: 'Missing "to" email address' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const success = await sendEmail({
      to,
      subject: '🧪 Test email - ADR Pomorze',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h1>✅ Test email działa!</h1>
          <p>Jeśli widzisz tę wiadomość, konfiguracja SMTP jest poprawna.</p>
          <p>Wysłano: ${new Date().toLocaleString('pl-PL')}</p>
          <hr>
          <p style="color: #666;">ADR Pomorze - System rezerwacji</p>
        </div>
      `
    });
    
    return new Response(JSON.stringify({ 
      success, 
      message: success ? 'Test email sent' : 'Failed to send'
    }), {
      status: success ? 200 : 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
