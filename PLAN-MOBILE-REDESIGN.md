# ADR-Pomorze: Mobile-First Redesign + System Rezerwacji

## 📱 Analiza obecnego stanu

### Struktura strony (kolejność sekcji):
1. **Hero** (90vh) - badge "Najbliższe szkolenie", headline, 2x CTA
2. **Kary** - ostrzeżenie o karach DGSA
3. **Oferta** - Dla Kierowców / Dla Firm
4. **Szkolenia** (kalendarz) ← **ZA DALEKO! 4 scrolle na mobile**
5. **Doradztwo** - outsourcing DGSA
6. **Kontakt** + Footer

### Problem mobile:
- Kalendarz szkoleń jest na 4-5 scrollu od góry
- Hero zajmuje 90vh (cały ekran)
- Użytkownik mobile musi dużo scrollować żeby zobaczyć terminy
- Brak quick-access do dat

---

## 🎯 Propozycja: Mobile-First Redesign

### Nowa struktura (mobile):

```
┌─────────────────────────────────────┐
│ HEADER (sticky)                     │
│ Logo | ☰ Menu | 📞 Tel              │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ HERO (kompaktowe)                   │
│ "Szkolenia ADR na Pomorzu"          │
│ [Zapisz się] [Doradztwo]            │
│                                     │
│ ⬇️ NAJBLIŻSZE TERMINY (inline!)    │
│ ┌─────────────────────────────────┐ │
│ │ 🟢 17-19.01 | Podstawowy | 3 msc│ │
│ │ 🟢 24-26.01 | Cysterny   | 5 msc│ │
│ │ 🟢 07-09.02 | Podstawowy | 8 msc│ │
│ └─────────────────────────────────┘ │
│ [Zobacz wszystkie terminy →]        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ SOCIAL PROOF (kompaktowe)           │
│ 15+ lat | 5000+ kierowców | 100%    │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ KARY (alert box)                    │
│ ⚠️ Bez doradcy = 5000 zł kary      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ PEŁNY KALENDARZ                     │
│ Filtry: typ kursu, miesiąc          │
│ Karty kursów z przyciskiem REZERWUJ │
└─────────────────────────────────────┘
```

### Kluczowe zmiany:

1. **Hero skrócone do ~60vh** na mobile
2. **Terminy wbudowane w Hero** - 3 najbliższe kursy widoczne od razu
3. **Sticky CTA** na dole ekranu mobile: "Zadzwoń" | "Zapisz się"
4. **Sekcja Kary** - skrócona do alert boxa
5. **Kalendarz** - pełny widok z systemem rezerwacji

---

## 📅 System Rezerwacji Online

### Przepływ użytkownika:
```
Kurs na stronie → Klik "Zapisz się" → Modal/Strona rezerwacji → Potwierdzenie
```

### Dane wymagane od osoby rezerwującej:

#### Dane osobowe:
- [ ] Imię i nazwisko
- [ ] PESEL (wymagany do certyfikatu ADR)
- [ ] Data urodzenia
- [ ] Miejsce urodzenia
- [ ] Adres zamieszkania
- [ ] Telefon kontaktowy
- [ ] Email

#### Dane do szkolenia:
- [ ] Typ kursu (podstawowy/specjalistyczny)
- [ ] Kategoria prawa jazdy
- [ ] Czy posiada aktualne zaświadczenie ADR? (odnowienie vs nowe)
- [ ] Nr aktualnego zaświadczenia ADR (jeśli odnowienie)
- [ ] Preferowany termin (wybór z dostępnych)

#### Dane płatności:
- [ ] Forma płatności (przelew/gotówka/faktura)
- [ ] Dane do faktury (opcjonalnie: NIP, nazwa firmy)

#### Zgody:
- [ ] Regulamin szkolenia
- [ ] RODO
- [ ] Newsletter (opcjonalnie)

### Schemat bazy danych (przyszłość):

```typescript
interface CourseSlot {
  id: string;
  courseType: 'podstawowy' | 'cysterny' | 'klasa1' | 'klasa7' | 'odnowienie';
  startDate: Date;
  endDate: Date;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  price: number;
  status: 'open' | 'full' | 'cancelled';
}

interface Reservation {
  id: string;
  courseSlotId: string;
  
  // Dane osobowe
  firstName: string;
  lastName: string;
  pesel: string;
  birthDate: Date;
  birthPlace: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  phone: string;
  email: string;
  
  // Dane szkoleniowe
  driverLicenseCategory: string;
  hasCurrentADR: boolean;
  currentADRNumber?: string;
  currentADRExpiry?: Date;
  
  // Płatność
  paymentMethod: 'transfer' | 'cash' | 'invoice';
  invoiceData?: {
    companyName: string;
    nip: string;
    address: string;
  };
  
  // Status
  status: 'pending' | 'confirmed' | 'paid' | 'cancelled';
  createdAt: Date;
  confirmedAt?: Date;
  paidAt?: Date;
}
```

---

## 🛠️ Implementacja - Fazy

### Faza 1: Mobile-First UI (teraz)
- [ ] Przebudowa Hero z inline terminami
- [ ] Skrócenie sekcji na mobile
- [ ] Sticky CTA na mobile
- [ ] Responsywny kalendarz

### Faza 2: Statyczny formularz rezerwacji
- [ ] Modal/strona z formularzem
- [ ] Walidacja pól
- [ ] Wysyłka emaila z danymi rezerwacji
- [ ] Potwierdzenie dla klienta

### Faza 3: Backend (przyszłość)
- [ ] Baza danych kursów i rezerwacji
- [ ] Panel admina
- [ ] Automatyczne powiadomienia
- [ ] Integracja z płatnościami (opcjonalnie)

---

## 📐 Wireframe Mobile Hero

```
┌────────────────────────────────────┐
│  ≡  ADR Pomorze          📞 502.. │ 56px
├────────────────────────────────────┤
│                                    │
│   Szkolenia ADR                    │
│   na Pomorzu                       │
│                                    │
│   15 lat doświadczenia             │
│   5000+ kierowców                  │
│                                    │
│   ┌──────────┐ ┌──────────┐       │
│   │ ZAPISZ   │ │ DORADCA  │       │
│   │ SIĘ →    │ │ DGSA     │       │
│   └──────────┘ └──────────┘       │
│                                    │
├────────────────────────────────────┤
│  📅 NAJBLIŻSZE TERMINY            │
├────────────────────────────────────┤
│  🟢 17-19.01  Podstawowy    [→]   │
│  🟢 24-26.01  Cysterny      [→]   │
│  🟢 07-09.02  Podstawowy    [→]   │
├────────────────────────────────────┤
│  [Zobacz wszystkie terminy ↓]      │
└────────────────────────────────────┘
```

---

## ✅ Do zatwierdzenia

1. **Czy struktura mobile jest OK?** (Hero + terminy inline)
2. **Czy pola rezerwacji są kompletne?** (PESEL, dane, itp.)
3. **Czy kolejność faz jest OK?** (UI → formularz → backend)
4. **Dodatkowe wymagania?**

---

*Wygenerowano: 2026-01-31 12:55*
