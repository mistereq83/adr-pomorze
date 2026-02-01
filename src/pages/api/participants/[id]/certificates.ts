import type { APIRoute } from 'astro';
import { db } from '../../../../db';
import { adrCertificates, participants, courses } from '../../../../db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/participants/:id/certificates - lista certyfikatów uczestnika
export const GET: APIRoute = async ({ params }) => {
  try {
    const participantId = parseInt(params.id!);
    
    const certs = await db
      .select({
        certificate: adrCertificates,
        course: courses,
      })
      .from(adrCertificates)
      .leftJoin(courses, eq(adrCertificates.courseId, courses.id))
      .where(eq(adrCertificates.participantId, participantId))
      .orderBy(desc(adrCertificates.expiryDate));
    
    return new Response(JSON.stringify(certs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania certyfikatów' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/participants/:id/certificates - dodaj nowy certyfikat
export const POST: APIRoute = async ({ params, request }) => {
  try {
    const participantId = parseInt(params.id!);
    const data = await request.json();
    
    // Sprawdź czy uczestnik istnieje
    const participant = await db.select().from(participants)
      .where(eq(participants.id, participantId))
      .limit(1);
    
    if (participant.length === 0) {
      return new Response(JSON.stringify({ error: 'Uczestnik nie istnieje' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Sprawdź czy to pierwsze uprawnienia (brak aktywnych certyfikatów)
    const existingCerts = await db.select().from(adrCertificates)
      .where(eq(adrCertificates.participantId, participantId));
    
    const isFirst = existingCerts.length === 0;
    
    // Jeśli dodajemy nowy aktywny certyfikat, oznacz poprzednie jako 'renewed'
    if (data.status === 'active' || !data.status) {
      await db.update(adrCertificates)
        .set({ status: 'renewed' })
        .where(eq(adrCertificates.participantId, participantId));
    }
    
    // Dodaj nowy certyfikat
    const newCert = await db.insert(adrCertificates).values({
      participantId,
      certificateNumber: data.certificateNumber || null,
      issueDate: data.issueDate || null,
      expiryDate: data.expiryDate,
      classes: data.classes,
      isFirst: data.isFirst !== undefined ? data.isFirst : isFirst,
      courseId: data.courseId || null,
      status: data.status || 'active',
      notes: data.notes || null,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy || 'system',
    }).returning();
    
    // Aktualizuj dane w participants
    await db.update(participants)
      .set({
        hasCurrentAdr: true,
        currentAdrNumber: data.certificateNumber || participant[0].currentAdrNumber,
        currentAdrExpiry: data.expiryDate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(participants.id, participantId));
    
    return new Response(JSON.stringify(newCert[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating certificate:', error);
    return new Response(JSON.stringify({ error: 'Błąd dodawania certyfikatu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
