# ADR-Pomorze.pl — Plan Przeprojektowania

## 📊 Analiza Obecnej Strony

### Co jest źle:
- **Design:** Przestarzały wygląd rodem z 2010, brak profesjonalizmu
- **Typografia:** Generyczne fonty systemowe
- **Layout:** Chaotyczny, lista dat kursów na stronie głównej bez hierarchii
- **Hero:** Brak — od razu wpadamy w terminarz
- **CTA:** Słabe ("Zadzwoń i zapisz się")
- **Social Proof:** Brak certyfikatów, opinii, liczb
- **Mobile:** Prawdopodobnie nieresponsywna
- **Nawigacja:** Uproszczona, ukrywa potencjał oferty
- **Treści:** Suche, techniczne, brak korzyści dla klienta

### Co działa:
- Jasna oferta (szkolenia + doradztwo)
- Aktualne terminy kursów
- Informacja o karach (motywacja do działania)
- Wieloletnie doświadczenie

---

## 🎯 Strategia i Cele

### Główne cele:
1. **Efekt WOW** — profesjonalna strona budująca zaufanie od pierwszej sekundy
2. **Przejrzystość** — jasna struktura, łatwe znalezienie informacji
3. **Konwersja** — zapisanie na szkolenie lub kontakt ws. doradztwa

### Docelowa persona:
- **Kierowcy** — chcą zdobyć/odnowić uprawnienia ADR
- **Firmy transportowe** — potrzebują doradcy DGSA
- **Nadawcy** — od 2023 muszą mieć doradcę (nowy rynek!)
- **Spedytorzy/Logistycy** — szkolenia dla pracowników

---

## 🎨 Kierunek Designu

### Aesthetic Direction: **Industrial Professional**

Inspiracja: przemysł transportowy, bezpieczeństwo, precyzja niemiecka (ADR = Accord européen)

**Paleta kolorów:**
```css
:root {
  --primary: #1a1a2e;        /* Głęboki granat — zaufanie, profesjonalizm */
  --accent: #ff6b35;         /* Ostrzegawczy pomarańcz — ADR, niebezpieczeństwo */
  --accent-alt: #00d4aa;     /* Bezpieczeństwo, certyfikacja */
  --surface: #f8f9fa;        /* Jasne tło */
  --surface-dark: #16213e;   /* Ciemne sekcje */
  --text: #1a1a2e;
  --text-muted: #6c757d;
}
```

**Typografia:**
- **Display:** Space Grotesk lub Archivo Black — techniczny, mocny
- **Body:** DM Sans lub Work Sans — czytelny, nowoczesny
- **Akcenty:** Roboto Mono — dla liczb, kodów ADR

**Elementy wizualne:**
- Ikony hazmat/warning jako motyw przewodni
- Geometryczne kształty (diagonale, skosy)
- Zdjęcia cystern, kierowców, certyfikatów
- Animowane liczniki (lata doświadczenia, przeszkolonych kierowców)
- Subtelne gradienty i glassmorphism

---

## 📐 Struktura Strony

### Strona Główna (Landing)

```
┌─────────────────────────────────────────────────┐
│  HERO                                           │
│  "Szkolenia i Doradztwo ADR na Pomorzu"        │
│  [Zapisz się na szkolenie] [Potrzebuję doradcy] │
│  Trust badges: 15+ lat, 5000+ kierowców, 100% zdawalność │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  PROBLEM / PAIN POINTS                          │
│  "Bez doradcy DGSA grożą Ci kary do 5000 zł"   │
│  Lista kar z ikonami (strach jako motywator)    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  OFERTA — 2 ŚCIEŻKI                            │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ DLA          │  │ DLA FIRM     │            │
│  │ KIEROWCÓW    │  │ DORADZTWO    │            │
│  │ Szkolenia ADR│  │ DGSA         │            │
│  │ [Zobacz →]   │  │ [Zobacz →]   │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  NAJBLIŻSZE SZKOLENIA                          │
│  Interaktywny kalendarz / tabela               │
│  Filtry: typ kursu, miesiąc                    │
│  [Zapisz się online]                           │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  SOCIAL PROOF                                   │
│  "Zaufali nam" — loga firm klientów            │
│  Statystyki: 15+ lat, 5000+ kierowców          │
│  Opinie klientów (karuzela)                    │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  O NAS / TOMASZ BRONK                          │
│  Zdjęcie, certyfikaty, doświadczenie           │
│  "Doradca z pasją i 15-letnim stażem"          │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  FAQ                                            │
│  Rozwijane pytania                             │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  CTA KOŃCOWE                                    │
│  "Nie ryzykuj kar. Zacznij dziś."              │
│  [Umów bezpłatną konsultację]                  │
└─────────────────────────────────────────────────┘
```

### Podstrony:

1. **Szkolenia Kierowców ADR** — kalendarz, cennik, program, FAQ
2. **Doradztwo DGSA** — dla kogo, zakres usług, cennik
3. **Dla Nadawców** — nowe przepisy od 2023, wyjaśnienie obowiązków
4. **Przepisy i Kary** — straszak z konkretnymi kwotami
5. **O Nas** — Tomasz Bronk, certyfikaty, historia
6. **Kontakt** — formularz, mapa, telefon

---

## ✍️ Nowe Teksty (Copywriting)

### Hero

**Headline opcje:**

> **A) Bezpieczeństwo w transporcie zaczyna się od szkolenia**
> Szkolenia ADR i doradztwo DGSA na Pomorzu. 15 lat doświadczenia. Ponad 5000 przeszkolonych kierowców.

> **B) Nie płać kar. Zdobądź uprawnienia ADR.**
> Regularne szkolenia w Gdańsku. Doradztwo dla firm transportowych i nadawców.

> **C) Twój partner w transporcie towarów niebezpiecznych**
> Szkolenia kierowców • Doradztwo DGSA • Pełna obsługa firm

**CTA:**
- `Zapisz się na szkolenie` (kierowcy)
- `Potrzebuję doradcy DGSA` (firmy)

---

### Sekcja Problem

**Headline:** "Kary za brak doradcy DGSA? Od 5000 zł w górę."

**Body:**
> Od 1 stycznia 2023 roku każda firma nadająca towary niebezpieczne musi wyznaczyć doradcę DGSA. Nie masz? Inspektorat naliczy kary:
>
> - ❌ Brak doradcy DGSA — **5 000 zł**
> - ❌ Brak rocznego sprawozdania — **5 000 zł**
> - ❌ Nieprzeszkoleni pracownicy — **2 000 zł**
>
> **Uniknij mandatów. Skontaktuj się z nami już dziś.**

---

### Oferta — Szkolenia Kierowców

**Headline:** "Zdobądź uprawnienia ADR w 3 dni"

**Subheadline:** Prowadzimy szkolenia ADR kilka razy w miesiącu. Weekend? W tygodniu? Dopasujemy się.

**USP:**
- ✓ **Nie odwołujemy kursów** — gwarantowany termin
- ✓ **Doświadczeni instruktorzy** — 15+ lat praktyki
- ✓ **Wysoka zdawalność** — przygotujemy Cię do egzaminu
- ✓ **Szkolenia firmowe** — przyjedziemy do Ciebie

**Rodzaje kursów:**
| Kurs | Czas trwania | Dla kogo |
|------|--------------|----------|
| Podstawowy | 3 dni | Każdy kierowca |
| Cysterny | 2 dni | Przewoźnicy paliw |
| Klasa 1 | 1 dzień | Materiały wybuchowe |
| Klasa 7 | 1 dzień | Materiały promieniotwórcze |

---

### Oferta — Doradztwo DGSA

**Headline:** "Twój doradca DGSA — bez zatrudniania etatowca"

**Subheadline:** Obsługujemy firmy transportowe i nadawców. Od rocznych sprawozdań po szkolenia pracowników.

**Co robimy:**
- 📋 Roczne sprawozdania do ITD (obowiązkowe do 28 lutego)
- 📚 Szkolenia pracowników (załadunek, dokumentacja)
- 📝 Procedury zgodności z ADR
- 🚨 Raporty powypadkowe
- 🔒 Plany ochrony towarów dużego ryzyka

**Dla kogo:**
- Firmy transportowe (przewóz, załadunek, rozładunek)
- Nadawcy towarów niebezpiecznych (od 2023!)
- Magazyny i centra logistyczne

---

### O Tomasz Bronk

**Headline:** "Tomasz Bronk — Twój doradca z 15-letnim stażem"

**Body:**
> Certyfikowany Doradca DGSA z wieloletnim doświadczeniem w transporcie towarów niebezpiecznych. Współpracuję z firmami przewożącymi wszystko — od paliw w cysternach po materiały promieniotwórcze klasy 7.
>
> Moja filozofia? **Nie tylko spełnić przepisy, ale naprawdę zadbać o bezpieczeństwo.** Dlatego szkolę nie tylko kierowców, ale całe zespoły — od magazynierów po pracowników biurowych przygotowujących dokumenty.

---

### FAQ (sugerowane pytania)

1. **Ile kosztuje kurs ADR?** → [cennik]
2. **Jak długo trwa szkolenie?** → 3 dni kurs podstawowy
3. **Czy mogę zorganizować szkolenie w mojej firmie?** → Tak, przyjedziemy
4. **Czym różni się doradca od instruktora?** → [wyjaśnienie]
5. **Czy nadawcy naprawdę muszą mieć doradcę?** → Tak, od 1.01.2023
6. **Jak szybko możecie przygotować sprawozdanie roczne?** → [termin]

---

## 🛠️ Tech Stack 2026

### Frontend:
- **Framework:** Next.js 15 (App Router) lub Astro 5 (dla statycznej wydajności)
- **Styling:** Tailwind CSS 4 + Shadcn/ui
- **Animacje:** Framer Motion lub Motion One
- **Typografia:** Google Fonts (Archivo + DM Sans)
- **Ikony:** Lucide Icons + custom hazmat icons

### Backend/CMS:
- **CMS:** Sanity.io (headless) lub Payload CMS
  - Edycja terminów szkoleń
  - Zarządzanie treścią
  - Blog/aktualności
- **Formularze:** React Hook Form + Resend (email)
- **Kalendarz szkoleń:** Custom component z filtrowaniem

### Hosting:
- **Platforma:** Vercel lub Coolify (self-hosted)
- **Domain:** adr-pomorze.pl (zachowany)
- **SSL:** Let's Encrypt (auto)

### Dodatkowe:
- **Analytics:** Plausible (GDPR-friendly) lub GA4
- **Mapy:** Google Maps Embed
- **Cookie consent:** Cookiebot lub custom (RODO)

---

## ✨ Elementy "Wow" do Dodania

### 1. Kalkulator Kar
Interaktywny widget: "Sprawdź, ile ryzykujesz"
- Czy masz doradcę DGSA? ❌ → +5000 zł
- Czy składasz sprawozdania? ❌ → +5000 zł
- Czy szkolisz pracowników? ❌ → +2000 zł
- **Suma: 12 000 zł potencjalnych kar!**
→ [Uniknij kar — skontaktuj się]

### 2. System Zapisów Online
- Wybierz termin z kalendarza
- Wypełnij dane
- Opcjonalna płatność online
- Potwierdzenie emailem

### 3. Strefa Klienta (opcjonalnie)
- Historia szkoleń
- Certyfikaty do pobrania (PDF)
- Przypomnienia o odnowieniu uprawnień

### 4. Blog / Aktualności
- Zmiany w przepisach ADR
- Case studies
- Porady dla firm transportowych
- SEO content (długi ogon)

### 5. Chatbot / Quick Contact
- "Masz pytanie? Napisz do nas"
- Integracja z WhatsApp/Messenger

### 6. Animacje przy scrollu
- Liczniki animowane (lat doświadczenia, kierowców)
- Parallax na hero
- Karty usług z hover effects

### 7. Certyfikaty / Badges
- Wizualizacja uprawnień Tomasza
- Logo TDT, certyfikaty DGSA
- "Zaufali nam" — loga firm

---

## 📅 Plan Wdrożenia

### Faza 1: Przygotowanie (1 tydzień)
- [ ] Zebranie materiałów (zdjęcia, certyfikaty, loga)
- [ ] Finalizacja tekstów
- [ ] Wybór ostatecznego designu
- [ ] Setup projektu (Next.js/Astro + CMS)

### Faza 2: Development (2-3 tygodnie)
- [ ] Strona główna + komponenty
- [ ] Podstrony (oferta, kontakt, przepisy)
- [ ] System kalendarza szkoleń
- [ ] Formularz zapisów/kontaktu
- [ ] Responsywność + testy
- [ ] CMS setup

### Faza 3: Content & Polish (1 tydzień)
- [ ] Import treści do CMS
- [ ] Optymalizacja zdjęć
- [ ] SEO (meta, OG, sitemap)
- [ ] Testy wydajności (Lighthouse)
- [ ] Cross-browser testing

### Faza 4: Launch (kilka dni)
- [ ] DNS migration
- [ ] SSL setup
- [ ] Analytics setup
- [ ] Backup starej strony
- [ ] Go live!

### Faza 5: Post-Launch
- [ ] Monitoring
- [ ] Zbieranie feedbacku
- [ ] Iteracje UX
- [ ] Blog content

---

## 💰 Szacowany Budżet

| Element | Zakres |
|---------|--------|
| Design + Development | 8 000 - 15 000 zł |
| CMS setup | w cenie |
| Hosting (rok) | 0 zł (Coolify) lub ~500 zł (Vercel Pro) |
| Domena (rok) | ~50 zł |
| Zdjęcia stock (opcja) | 500 - 1000 zł |
| **Razem** | **~10 000 - 17 000 zł** |

*Lub możemy zbudować to in-house w ramach współpracy.*

---

## 🎯 Podsumowanie

**Obecna strona:** Przestarzała, chaotyczna, nie buduje zaufania.

**Nowa strona:** Profesjonalna, przejrzysta, konwertująca — z efektem wow.

**Kluczowe zmiany:**
1. Nowoczesny design (industrial professional)
2. Jasna struktura (2 ścieżki: kierowcy vs firmy)
3. Przekonujące teksty (korzyści, nie funkcje)
4. Social proof (liczby, opinie, certyfikaty)
5. Interaktywne elementy (kalendarz, kalkulator kar)
6. Tech stack 2026 (Next.js/Astro + CMS)

**Następny krok:** Akceptacja planu → przejście do fazy designu i kodowania.

---

*Przygotował: Ray | Data: 31.01.2026*
