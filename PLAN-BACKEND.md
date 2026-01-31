# ADR-Pomorze: System Rejestracji na Szkolenia

## 🎯 Cel systemu

Pełna obsługa zgłoszeń na szkolenia ADR:
- Rejestracja online przez formularz
- Ręczne dodawanie uczestników przez admina
- Zarządzanie kursami i terminami
- Baza uczestników (historia szkoleń)

---

## 🏗️ Architektura

### Opcja A: Astro + SQLite + Panel Admin (REKOMENDOWANA)
```
┌─────────────────┐     ┌─────────────────┐
│   Strona WWW    │────▶│   Astro SSR     │
│  (formularz)    │     │   + API routes  │
└─────────────────┘     └────────┬────────┘
                                 │
┌─────────────────┐     ┌────────▼────────┐
│   Panel Admin   │────▶│    SQLite DB    │
│  (zarządzanie)  │     │  (Turso/local)  │
└─────────────────┘     └─────────────────┘
```

**Zalety:**
- Jeden projekt (Astro SSR)
- Prosta baza (SQLite/Turso - serverless)
- Szybki deploy na Coolify
- Brak dodatkowych kosztów

### Opcja B: Headless CMS (Strapi/Payload)
- Więcej setup'u
- Osobny serwer
- Dobra opcja na przyszłość jeśli potrzeba CMS

**Rekomenduję Opcję A** — szybsza, prostsza, wystarczająca.

---

## 📊 Model danych

### Tabele:

```sql
-- Kursy/Terminy
CREATE TABLE courses (
  id INTEGER PRIMARY KEY,
  course_type TEXT NOT NULL,        -- 'podstawowy', 'cysterny', 'klasa1', 'klasa7', 'odnowienie'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  location TEXT DEFAULT 'Gdańsk',
  max_participants INTEGER DEFAULT 15,
  price DECIMAL(10,2),
  status TEXT DEFAULT 'open',       -- 'open', 'full', 'completed', 'cancelled'
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Uczestnicy (baza kontaktów)
CREATE TABLE participants (
  id INTEGER PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  pesel TEXT,                       -- opcjonalnie przy rejestracji, wymagane przed szkoleniem
  birth_date DATE,
  birth_place TEXT,
  
  -- Adres
  street TEXT,
  city TEXT,
  postal_code TEXT,
  
  -- Kontakt
  phone TEXT NOT NULL,
  email TEXT,
  
  -- ADR
  has_current_adr BOOLEAN DEFAULT FALSE,
  current_adr_number TEXT,
  current_adr_expiry DATE,
  driver_license_categories TEXT,   -- np. "B, C, CE"
  
  -- Meta
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME
);

-- Rezerwacje (łączy uczestników z kursami)
CREATE TABLE reservations (
  id INTEGER PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  participant_id INTEGER REFERENCES participants(id),
  
  -- Status
  status TEXT DEFAULT 'pending',    -- 'pending', 'confirmed', 'paid', 'completed', 'cancelled', 'no_show'
  
  -- Płatność
  payment_method TEXT,              -- 'transfer', 'cash', 'invoice'
  payment_status TEXT DEFAULT 'unpaid', -- 'unpaid', 'partial', 'paid'
  amount_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Faktura
  needs_invoice BOOLEAN DEFAULT FALSE,
  invoice_company TEXT,
  invoice_nip TEXT,
  invoice_address TEXT,
  invoice_number TEXT,
  
  -- Źródło
  source TEXT DEFAULT 'website',    -- 'website', 'phone', 'email', 'manual'
  
  -- Zgody
  consent_rules BOOLEAN DEFAULT FALSE,
  consent_rodo BOOLEAN DEFAULT FALSE,
  consent_newsletter BOOLEAN DEFAULT FALSE,
  
  -- Meta
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  confirmed_at DATETIME,
  paid_at DATETIME
);

-- Historia/logi
CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY,
  entity_type TEXT,                 -- 'course', 'participant', 'reservation'
  entity_id INTEGER,
  action TEXT,                      -- 'created', 'updated', 'status_changed', etc.
  details TEXT,                     -- JSON z dodatkowymi info
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🖥️ Funkcje systemu

### Panel Admin (`/admin`)

#### Dashboard
- Statystyki: ile rezerwacji, ile miejsc wolnych
- Najbliższe kursy
- Ostatnie zgłoszenia (do potwierdzenia)

#### Zarządzanie kursami (`/admin/courses`)
- Lista kursów (filtry: status, data, typ)
- Dodawanie nowego kursu
- Edycja kursu
- Lista uczestników kursu
- Zmiana statusu (otwórz/zamknij/anuluj)

#### Zarządzanie rezerwacjami (`/admin/reservations`)
- Lista wszystkich rezerwacji
- Filtry: status, kurs, data
- Szczegóły rezerwacji
- Zmiana statusu (potwierdź/anuluj)
- Oznaczanie płatności
- Wystawianie faktury (generowanie numeru)

#### Zarządzanie uczestnikami (`/admin/participants`)
- Baza wszystkich uczestników
- Wyszukiwanie (nazwisko, PESEL, telefon)
- Historia szkoleń danej osoby
- Edycja danych
- Ręczne dodawanie uczestnika

#### Ręczne dodawanie rezerwacji (`/admin/reservations/new`)
- Wybór kursu
- Wyszukanie istniejącego uczestnika LUB dodanie nowego
- Ustawienie statusu, płatności, notatek

### Formularz publiczny (`/rezerwacja`)

#### Krok 1: Wybór kursu
- Lista dostępnych terminów
- Podświetlenie typu kursu
- Info o wolnych miejscach

#### Krok 2: Dane osobowe
- Imię, nazwisko (wymagane)
- Telefon (wymagane)
- Email (opcjonalne, ale zalecane)
- Czy ma aktualne ADR? (tak/nie)
- PESEL (opcjonalne przy rejestracji)

#### Krok 3: Płatność i zgody
- Forma płatności (przelew/gotówka)
- Dane do faktury (opcjonalne)
- Checkbox: regulamin
- Checkbox: RODO
- Checkbox: newsletter (opcjonalnie)

#### Krok 4: Potwierdzenie
- Podsumowanie danych
- Info o kolejnych krokach
- Email z potwierdzeniem

---

## 🔐 Autoryzacja admin

**Prosty wariant (na start):**
- Basic Auth lub pojedyncze hasło w env
- Middleware sprawdza nagłówek/cookie

**Przyszłość:**
- Logowanie email/hasło
- Sesje w DB

---

## 📧 Powiadomienia email

### Dla klienta:
1. **Potwierdzenie zgłoszenia** — zaraz po wysłaniu formularza
2. **Potwierdzenie rezerwacji** — po akceptacji przez admina
3. **Przypomnienie** — 3 dni przed szkoleniem
4. **Potwierdzenie płatności** — po oznaczeniu jako opłacone

### Dla admina:
1. **Nowe zgłoszenie** — email/SMS o nowej rezerwacji

**Implementacja:** Resend.com (darmowe 100 emaili/dzień) lub nodemailer + SMTP.

---

## 📅 Plan wdrożenia

### Faza 1: Baza + API (2-3h)
- [ ] Konfiguracja Astro SSR
- [ ] Setup SQLite (Turso lub local)
- [ ] Definicja schemy (Drizzle ORM)
- [ ] API routes: CRUD dla courses, participants, reservations

### Faza 2: Panel Admin (3-4h)
- [ ] Prosty auth (hasło w env)
- [ ] Dashboard ze statystykami
- [ ] Lista i zarządzanie kursami
- [ ] Lista i zarządzanie rezerwacjami
- [ ] Ręczne dodawanie rezerwacji
- [ ] Wyszukiwarka uczestników

### Faza 3: Formularz publiczny (2h)
- [ ] Multi-step form
- [ ] Walidacja
- [ ] Zapis do bazy
- [ ] Strona "dziękujemy"

### Faza 4: Powiadomienia (1-2h)
- [ ] Setup Resend/nodemailer
- [ ] Template emaili
- [ ] Wysyłka przy nowej rezerwacji
- [ ] Wysyłka przy zmianie statusu

### Faza 5: Polish (1-2h)
- [ ] Eksport do CSV/Excel
- [ ] Filtry i sortowanie
- [ ] Responsywność panelu
- [ ] Testy

**Łącznie: ~10-12h pracy**

---

## 🛠️ Stack technologiczny

| Komponent | Technologia |
|-----------|-------------|
| Frontend | Astro 5 + Tailwind |
| Backend | Astro SSR (Node adapter) |
| Baza danych | SQLite (Turso serverless) |
| ORM | Drizzle ORM |
| Auth | Simple password + cookies |
| Email | Resend.com |
| Deploy | Coolify (Docker) |

---

## ✅ Do zatwierdzenia

1. **Architektura OK?** (Astro SSR + SQLite)
2. **Model danych OK?** (courses, participants, reservations)
3. **Funkcje admin OK?** (dashboard, CRUD, ręczne dodawanie)
4. **Kolejność faz OK?**
5. **Dodatkowe wymagania?**

---

*Wygenerowano: 2026-01-31 14:25*
