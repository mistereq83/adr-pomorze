import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { adrCertificates, participants } from '../../../db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';

// GET /api/certificates/expiring?months=6 - certyfikaty wygasające w ciągu X miesięcy
export const GET: APIRoute = async ({ url }) => {
  try {
    const months = parseInt(url.searchParams.get('months') || '6');
    
    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);
    
    const todayISO = today.toISOString().split('T')[0];
    const futureISO = futureDate.toISOString().split('T')[0];
    
    // Pobierz aktywne certyfikaty wygasające w zadanym okresie
    const expiring = await db
      .select({
        certificate: adrCertificates,
        participant: participants,
      })
      .from(adrCertificates)
      .innerJoin(participants, eq(adrCertificates.participantId, participants.id))
      .where(
        and(
          eq(adrCertificates.status, 'active'),
          gte(adrCertificates.expiryDate, todayISO),
          lte(adrCertificates.expiryDate, futureISO)
        )
      );
    
    // Grupuj po czasie do wygaśnięcia
    const result = expiring.map(item => {
      const expiryDate = new Date(item.certificate.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const monthsUntilExpiry = Math.floor(daysUntilExpiry / 30);
      
      return {
        ...item,
        daysUntilExpiry,
        monthsUntilExpiry,
        urgency: daysUntilExpiry <= 30 ? 'critical' : daysUntilExpiry <= 90 ? 'warning' : 'info'
      };
    });
    
    // Sortuj po dacie wygaśnięcia (najpilniejsze najpierw)
    result.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
    
    return new Response(JSON.stringify({
      count: result.length,
      items: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching expiring certificates:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania wygasających certyfikatów' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
