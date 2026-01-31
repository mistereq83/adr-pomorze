import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { courses } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';

// GET /api/courses - lista kursów
export const GET: APIRoute = async ({ url }) => {
  try {
    const status = url.searchParams.get('status');
    
    let query = db.select().from(courses).orderBy(desc(courses.startDate));
    
    if (status) {
      query = db.select().from(courses).where(eq(courses.status, status)).orderBy(desc(courses.startDate));
    }
    
    const result = await query;
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania kursów' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// POST /api/courses - nowy kurs
export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    const result = await db.insert(courses).values({
      courseType: data.courseType,
      startDate: data.startDate,
      endDate: data.endDate,
      location: data.location || 'Gdańsk',
      maxParticipants: data.maxParticipants || 15,
      price: data.price,
      status: data.status || 'open',
      notes: data.notes,
      createdAt: new Date().toISOString(),
    }).returning();
    
    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return new Response(JSON.stringify({ error: 'Błąd tworzenia kursu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
