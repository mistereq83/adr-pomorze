import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { adrCertificates, participants } from '../../../db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { sendSms } from '../../../lib/sms';

const CRON_SECRET = import.meta.env.CRON_SECRET || process.env.CRON_SECRET || 'adr-reminder-cron-K8mX2pL9';

/**
 * GET /api/cron/adr-expiry-reminders
 * 
 * Wysyła przypomnienia o wygasających uprawnieniach ADR.
 * Wywoływać raz dziennie (np. o 10:00).
 * 
 * Przypomnienia:
 * - 6 miesięcy przed: email
 * - 3 miesiące przed: SMS + email  
 * - 1 miesiąc przed: SMS
 * 
 * Query params:
 * - secret: klucz autoryzacyjny
 * - dry_run=1: tylko sprawdź, nie wysyłaj
 */
export const GET: APIRoute = async ({ url }) => {
  const secret = url.searchParams.get('secret');
  const dryRun = url.searchParams.get('dry_run') === '1';
  
  if (secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    
    // Daty graniczne
    const in6Months = new Date(today);
    in6Months.setMonth(in6Months.getMonth() + 6);
    const in6MonthsISO = in6Months.toISOString().split('T')[0];
    
    const in3Months = new Date(today);
    in3Months.setMonth(in3Months.getMonth() + 3);
    const in3MonthsISO = in3Months.toISOString().split('T')[0];
    
    const in1Month = new Date(today);
    in1Month.setMonth(in1Month.getMonth() + 1);
    const in1MonthISO = in1Month.toISOString().split('T')[0];
    
    // Tolerancja ±3 dni (żeby złapać dokładnie te daty)
    const tolerance = 3;
    
    const results: Array<{
      certificateId: number;
      participant: string;
      phone: string;
      email: string | null;
      expiryDate: string;
      reminderType: '6m' | '3m' | '1m';
      success: boolean;
      error?: string;
    }> = [];
    
    // Pobierz wszystkie aktywne certyfikaty
    const activeCerts = await db
      .select({
        certificate: adrCertificates,
        participant: participants,
      })
      .from(adrCertificates)
      .innerJoin(participants, eq(adrCertificates.participantId, participants.id))
      .where(
        and(
          eq(adrCertificates.status, 'active'),
          gte(adrCertificates.expiryDate, todayISO)
        )
      );
    
    for (const item of activeCerts) {
      const cert = item.certificate;
      const p = item.participant;
      const expiryDate = new Date(cert.expiryDate);
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Sprawdź czy trzeba wysłać przypomnienie
      let reminderType: '6m' | '3m' | '1m' | null = null;
      let shouldSendSms = false;
      let shouldSendEmail = false;
      
      // ~6 miesięcy (180 dni ± tolerancja)
      if (daysUntil >= 180 - tolerance && daysUntil <= 180 + tolerance && !cert.reminder6mSent) {
        reminderType = '6m';
        shouldSendEmail = true;
      }
      // ~3 miesiące (90 dni ± tolerancja)
      else if (daysUntil >= 90 - tolerance && daysUntil <= 90 + tolerance && !cert.reminder3mSent) {
        reminderType = '3m';
        shouldSendSms = true;
        shouldSendEmail = true;
      }
      // ~1 miesiąc (30 dni ± tolerancja)
      else if (daysUntil >= 30 - tolerance && daysUntil <= 30 + tolerance && !cert.reminder1mSent) {
        reminderType = '1m';
        shouldSendSms = true;
      }
      
      if (!reminderType) continue;
      
      const participantName = `${p.firstName} ${p.lastName}`;
      
      if (dryRun) {
        results.push({
          certificateId: cert.id,
          participant: participantName,
          phone: p.phone,
          email: p.email,
          expiryDate: cert.expiryDate,
          reminderType,
          success: true,
          error: 'DRY RUN',
        });
        continue;
      }
      
      let success = true;
      let error = '';
      
      // Wyślij SMS
      if (shouldSendSms && p.phone) {
        const smsText = reminderType === '1m' 
          ? `${p.firstName}, Twoje uprawnienia ADR wygasają za miesiąc (${cert.expiryDate})! Zapisz się na szkolenie: adr-pomorze.pl lub zadzwoń: 502 611 639`
          : `${p.firstName}, Twoje uprawnienia ADR wygasają za 3 miesiące (${cert.expiryDate}). Zaplanuj szkolenie odnawiające: adr-pomorze.pl`;
        
        const smsResult = await sendSms(p.phone, smsText, participantName);
        if (!smsResult.success) {
          success = false;
          error = smsResult.error || 'SMS failed';
        }
      }
      
      // TODO: Wyślij email (gdy będzie zintegrowany)
      // if (shouldSendEmail && p.email) { ... }
      
      // Oznacz przypomnienie jako wysłane
      if (success) {
        const updateField = reminderType === '6m' ? { reminder6mSent: true }
          : reminderType === '3m' ? { reminder3mSent: true }
          : { reminder1mSent: true };
        
        await db.update(adrCertificates)
          .set(updateField)
          .where(eq(adrCertificates.id, cert.id));
      }
      
      results.push({
        certificateId: cert.id,
        participant: participantName,
        phone: p.phone,
        email: p.email,
        expiryDate: cert.expiryDate,
        reminderType,
        success,
        error,
      });
    }
    
    const successCount = results.filter(r => r.success).length;
    
    return new Response(JSON.stringify({
      message: `Wysłano ${successCount}/${results.length} przypomnień o wygasających ADR`,
      date: todayISO,
      sent: successCount,
      total: results.length,
      dryRun,
      details: results,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('ADR expiry cron error:', error);
    return new Response(JSON.stringify({ 
      error: 'Błąd wysyłania przypomnień',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
