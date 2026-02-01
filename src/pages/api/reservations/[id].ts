import type { APIRoute } from 'astro';
import { db } from '../../../db';
import { reservations } from '../../../db/schema';
import { eq } from 'drizzle-orm';
import { sendSmsForEvent } from '../../../lib/sms';
import { sendEmailForEvent } from '../../../lib/email-service';

// PUT /api/reservations/:id - aktualizacja rezerwacji (status, płatność)
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const data = await request.json();
    
    // Pobierz obecny status przed zmianą
    const currentReservation = await db.select()
      .from(reservations)
      .where(eq(reservations.id, id))
      .get();
    
    const previousStatus = currentReservation?.status;
    
    const updateData: any = {};
    
    // Status rezerwacji
    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === 'confirmed') {
        updateData.confirmedAt = new Date().toISOString();
      }
    }
    
    // Status płatności
    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus;
      if (data.paymentStatus === 'paid') {
        updateData.paidAt = new Date().toISOString();
      }
    }
    
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
    
    // Faktura
    if (data.needsInvoice !== undefined) updateData.needsInvoice = data.needsInvoice;
    if (data.invoiceCompany !== undefined) updateData.invoiceCompany = data.invoiceCompany;
    if (data.invoiceNip !== undefined) updateData.invoiceNip = data.invoiceNip;
    if (data.invoiceAddress !== undefined) updateData.invoiceAddress = data.invoiceAddress;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    
    // Notatki
    if (data.notes !== undefined) updateData.notes = data.notes;
    
    const result = await db.update(reservations)
      .set(updateData)
      .where(eq(reservations.id, id))
      .returning();
    
    if (result.length === 0) {
      return new Response(JSON.stringify({ error: 'Rezerwacja nie znaleziona' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Wyślij SMS i email przy zmianie statusu
    let smsResult = null;
    let emailResult = null;
    if (data.status && data.status !== previousStatus) {
      if (data.status === 'confirmed') {
        // Potwierdzona → SMS + Email
        smsResult = await sendSmsForEvent('reservation_confirmed', id);
        try {
          emailResult = await sendEmailForEvent('reservation_confirmed', id);
        } catch (e) { console.error('Email error:', e); }
      } else if (data.status === 'paid') {
        // Opłacona → SMS + Email
        smsResult = await sendSmsForEvent('reservation_paid', id);
        try {
          emailResult = await sendEmailForEvent('reservation_paid', id);
        } catch (e) { console.error('Email error:', e); }
      }
    }
    
    return new Response(JSON.stringify({ ...result[0], smsResult, emailResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating reservation:', error);
    return new Response(JSON.stringify({ error: 'Błąd aktualizacji rezerwacji' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// DELETE /api/reservations/:id - usunięcie rezerwacji
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    
    await db.delete(reservations).where(eq(reservations.id, id));
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    return new Response(JSON.stringify({ error: 'Błąd usuwania rezerwacji' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
