import { db } from '../db';
import { participants, type Participant, type NewParticipant } from '../db/schema';
import { eq, or } from 'drizzle-orm';

interface ParticipantInput {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  pesel?: string | null;
  hasCurrentAdr?: boolean;
  currentAdrNumber?: string | null;
  notes?: string | null;
}

interface FindOrCreateResult {
  participant: Participant;
  isNew: boolean;
  matched: 'pesel' | 'phone' | 'email' | null;
  fieldsUpdated: string[];
}

/**
 * Znajduje istniejącego uczestnika lub tworzy nowego.
 * Priorytet dopasowania: PESEL > telefon > email
 * Email jest zawsze aktualizowany (wymagany do komunikacji).
 */
export async function findOrCreateParticipant(input: ParticipantInput): Promise<FindOrCreateResult> {
  const normalizedPhone = input.phone.replace(/[\s\-\(\)]/g, '');
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedPesel = input.pesel?.replace(/\s/g, '') || null;
  
  let existingParticipant: Participant | undefined;
  let matchedBy: 'pesel' | 'phone' | 'email' | null = null;
  
  // 1. Szukaj po PESEL (najwyższy priorytet)
  if (normalizedPesel && normalizedPesel.length === 11) {
    const found = await db.select().from(participants)
      .where(eq(participants.pesel, normalizedPesel))
      .limit(1);
    
    if (found.length > 0) {
      existingParticipant = found[0];
      matchedBy = 'pesel';
    }
  }
  
  // 2. Szukaj po telefonie
  if (!existingParticipant) {
    const found = await db.select().from(participants)
      .where(eq(participants.phone, normalizedPhone))
      .limit(1);
    
    if (found.length > 0) {
      existingParticipant = found[0];
      matchedBy = 'phone';
    }
  }
  
  // 3. Szukaj po email
  if (!existingParticipant && normalizedEmail) {
    const found = await db.select().from(participants)
      .where(eq(participants.email, normalizedEmail))
      .limit(1);
    
    if (found.length > 0) {
      existingParticipant = found[0];
      matchedBy = 'email';
    }
  }
  
  // Jeśli znaleziono - zaktualizuj brakujące pola
  if (existingParticipant) {
    const updates: Partial<NewParticipant> = {};
    const fieldsUpdated: string[] = [];
    
    // Email - ZAWSZE aktualizuj (wymagany do komunikacji)
    if (normalizedEmail && existingParticipant.email !== normalizedEmail) {
      updates.email = normalizedEmail;
      fieldsUpdated.push('email');
    }
    
    // Telefon - uzupełnij jeśli inny (może być nowszy)
    if (normalizedPhone && existingParticipant.phone !== normalizedPhone) {
      updates.phone = normalizedPhone;
      fieldsUpdated.push('phone');
    }
    
    // PESEL - uzupełnij tylko jeśli brakowało
    if (normalizedPesel && !existingParticipant.pesel) {
      updates.pesel = normalizedPesel;
      fieldsUpdated.push('pesel');
    }
    
    // ADR - uzupełnij jeśli podano
    if (input.hasCurrentAdr && !existingParticipant.hasCurrentAdr) {
      updates.hasCurrentAdr = input.hasCurrentAdr;
      fieldsUpdated.push('hasCurrentAdr');
    }
    if (input.currentAdrNumber && !existingParticipant.currentAdrNumber) {
      updates.currentAdrNumber = input.currentAdrNumber;
      fieldsUpdated.push('currentAdrNumber');
    }
    
    // Timestamp aktualizacji
    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      
      await db.update(participants)
        .set(updates)
        .where(eq(participants.id, existingParticipant.id));
      
      // Pobierz zaktualizowany rekord
      const updated = await db.select().from(participants)
        .where(eq(participants.id, existingParticipant.id))
        .limit(1);
      
      return {
        participant: updated[0],
        isNew: false,
        matched: matchedBy,
        fieldsUpdated
      };
    }
    
    return {
      participant: existingParticipant,
      isNew: false,
      matched: matchedBy,
      fieldsUpdated: []
    };
  }
  
  // Nie znaleziono - utwórz nowego
  const newParticipant = await db.insert(participants).values({
    firstName: input.firstName,
    lastName: input.lastName,
    phone: normalizedPhone,
    email: normalizedEmail,
    pesel: normalizedPesel,
    hasCurrentAdr: input.hasCurrentAdr || false,
    currentAdrNumber: input.currentAdrNumber || null,
    notes: input.notes || null,
    createdAt: new Date().toISOString(),
  }).returning();
  
  return {
    participant: newParticipant[0],
    isNew: true,
    matched: null,
    fieldsUpdated: []
  };
}
