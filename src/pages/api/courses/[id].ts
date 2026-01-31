import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { courses } from '../../../db/schema';
import { eq } from 'drizzle-orm';

// GET /api/courses/:id - pojedynczy kurs
export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    const result = await db.select().from(courses).where(eq(courses.id, id));
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Kurs nie znaleziony' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return new Response(JSON.stringify({ error: 'Błąd pobierania kursu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// PUT /api/courses/:id - aktualizacja kursu
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const data = await request.json();
    
    const result = await db.update(courses)
      .set({
        courseType: data.courseType,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        maxParticipants: data.maxParticipants,
        price: data.price,
        status: data.status,
        notes: data.notes,
      })
      .where(eq(courses.id, id))
      .returning();
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Kurs nie znaleziony' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return new Response(JSON.stringify({ error: 'Błąd aktualizacji kursu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/courses/:id - usunięcie kursu
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    
    await db.delete(courses).where(eq(courses.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    return new Response(JSON.stringify({ error: 'Błąd usuwania kursu' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
