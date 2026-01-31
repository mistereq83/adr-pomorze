// Walidacja i normalizacja polskich numerów telefonów

/**
 * Normalizuje numer telefonu do formatu 48XXXXXXXXX
 * Akceptuje: 606646095, +48606646095, 0048606646095, 48 606 646 095, itp.
 */
export function normalizePhone(phone: string): string {
  // Usuń wszystko oprócz cyfr
  let digits = phone.replace(/\D/g, '');
  
  // Usuń prefix 48 lub 0048 jeśli jest
  if (digits.startsWith('48') && digits.length === 11) {
    // już ok, format 48XXXXXXXXX
  } else if (digits.startsWith('0048')) {
    digits = '48' + digits.slice(4);
  } else if (digits.length === 9) {
    // Dodaj prefix 48
    digits = '48' + digits;
  }
  
  return digits;
}

/**
 * Sprawdza czy numer jest poprawnym polskim numerem komórkowym
 */
export function isValidPolishMobile(phone: string): boolean {
  const normalized = normalizePhone(phone);
  
  // Musi mieć 11 cyfr (48 + 9 cyfr)
  if (normalized.length !== 11) return false;
  
  // Musi zaczynać się od 48
  if (!normalized.startsWith('48')) return false;
  
  // Polska komórka zaczyna się od 5, 6, 7, 8
  const mobilePrefix = normalized.charAt(2);
  if (!['5', '6', '7', '8'].includes(mobilePrefix)) return false;
  
  return true;
}

/**
 * Formatuje numer do czytelnej postaci XXX XXX XXX
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhone(phone);
  
  if (normalized.length === 11 && normalized.startsWith('48')) {
    const local = normalized.slice(2); // usuń 48
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  
  return phone; // zwróć oryginał jeśli nie pasuje
}

/**
 * Waliduje i zwraca znormalizowany numer lub null jeśli niepoprawny
 */
export function validateAndNormalizePhone(phone: string): string | null {
  if (!phone || phone.trim() === '') return null;
  
  const normalized = normalizePhone(phone);
  
  if (!isValidPolishMobile(normalized)) {
    return null;
  }
  
  return normalized;
}
