import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { participants } from '../../../db/schema';
import { like, or, desc } from 'drizzle-orm';
import { validateAndNormalizePhone } from '../../../lib/phone';

// GET /api/participants - lista uczestników z wyszukiwaniem
export const GET: APIRoute = async ({ url }) => {
  try {
    const search = url.searchParams.get('search');
    
    let result;
    
    if (search) {
      const searchPattern = `%${search}%`;
      result = await db.select().from(participants)
        .where(
          or(
            like(participants.lastName, searchPattern),
            like(participants.firstName, searchPattern),
            like(participants.phone, searchPattern),
            like(participants.pesel, searchPattern),
            like(participants.email, searchPattern)
          )
        )
        .orderBy(desc(participants.createdAt))
        .limit(50);
    } else {
      result = await db.select().from(participants)
        .orderBy(desc(participants.createdAt))
        .limit(100);
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania uczestników' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/participants - nowy uczestnik
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Walidacja numeru telefonu
    const normalizedPhone = validateAndNormalizePhone(data.phone);
    if (!normalizedPhone) {
      return new Response(JSON.stringify({ 
        error: 'Nieprawidłowy numer telefonu. Podaj 9-cyfrowy polski numer komórkowy.' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await db.insert(participants).values({
      firstName: data.firstName,
      lastName: data.lastName,
      pesel: data.pesel,
      birthDate: data.birthDate,
      birthPlace: data.birthPlace,
      street: data.street,
      city: data.city,
      postalCode: data.postalCode,
      phone: normalizedPhone,
      email: data.email,
      hasCurrentAdr: data.hasCurrentAdr || false,
      currentAdrNumber: data.currentAdrNumber,
      currentAdrExpiry: data.currentAdrExpiry,
      driverLicenseCategories: data.driverLicenseCategories,
      notes: data.notes,
      createdAt: new Date().toISOString(),
    }).returning();
    
    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating participant:', error);
    return new Response(JSON.stringify({ error: 'Błąd tworzenia uczestnika' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
