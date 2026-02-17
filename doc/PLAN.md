# Froggy Cross - Game Design Document & Plan

## Wzorcowa gra (reference)

Wizualnie i jakosciowo wzorujemy sie na **Chicken Road** (https://chicken-road-two.inout.games/).
Mechanika jest jednak **zupelnie inna** - to gra arcade, nie hazardowa.

### Roznice wzgledem Chicken Road:
| Chicken Road | Froggy Cross |
|---|---|
| Gracz stawia zaklad i akceptuje ruch | Gracz sam steruje zaba (klawiatura/dotyk) |
| Automatyczne skoki co 3s | Skok na zadanie gracza (strzalki/WASD) |
| System zakladow, mnoznikow, cash-out | System punktow, zyc, rekordow |
| 6 kurczakow (multi-station) | 1 zaba (single player) |
| Crash = strata zakladu | Crash = strata zycia |
| Gra hazardowa (gambling) | Gra zrecznosciowa (arcade) |

### Co bierzemy z Chicken Road:
- Uklad wizualny: chodnik po lewej, pasy ruchu w prawo, samochody jadace gora/dol
- Wlazy kanalizacyjne jako znaczniki pasow (ale bez mnoznikow - pokazuja numer pasa)
- Barierki za zaba po przejsciu pasa
- Styl grafik: cartoon, kolorowe sprite'y
- Dzwieki: Web Audio API
- Jakosc UI: header, HUD, ekran startowy, game over

---

## STATUS PROJEKTU

### ZROBIONE (v0.1 - prototype):
- [x] Canvas 2D rendering
- [x] Zaba z animacja skoku
- [x] Proceduralne generowanie kolumn (trawa/droga)
- [x] Pojazdy (samochody + ciezarowki) jadace gora/dol
- [x] Kolizje zaba vs pojazd
- [x] System 3 zyc
- [x] Wynik (najdalsza kolumna)
- [x] Kamera podazajaca za zaba
- [x] Sterowanie klawiatura + dotyk
- [x] Ekran menu i game over
- [x] Modulowa struktura JS

### DO ZROBIENIA:
- [ ] Faza 1: Nowy uklad wizualny (wzor: Chicken Road)
- [ ] Faza 2: Sprite'y i grafiki
- [ ] Faza 3: Dzwieki
- [ ] Faza 4: UI i ekrany
- [ ] Faza 5: Mechaniki gameplay
- [ ] Faza 6: Polish i optymalizacja

---

## Opis gry

Gra zrecznosciowa 2D w ktorej gracz steruje zaba przechodzaca przez ruchliwa droge.
Zaba startuje na chodniku po lewej stronie i musi przejsc jak najwiecej pasow ruchu w prawo,
omijajac samochody i ciezarowki.

### Mechanika:
- Zaba stoi na chodniku (strefa bezpieczna po lewej)
- Na prawo sa pasy ruchu - kazdy z samochodami jadacymi gora lub dol
- Gracz naciska strzalke w prawo (lub swipe) - zaba przeskakuje na kolejny pas
- Jesli samochod trafi zabe podczas przeskoku lub stania = **strata zycia**
- Jesli zaba bezpiecznie przejdzie = barierka pojawia sie za nia (wizualnie jak w Chicken Road)
- Gracz moze tez ruszac sie gora/dol zeby unikac samochodow w obrebie pasa
- Co kilka pasow jest strefa bezpieczna (wysepka/chodnik) - punkt kontrolny
- 3 zycia, po utracie wszystkich = game over
- Wynik = najdalszy osiagniety pas

---

## Uklad ekranu (wzor: Chicken Road)

```
+------------------------------------------------------------------+
|  FROGGY CROSS              Wynik: 15    Rekord: 42    [zycia]    |
+--------+---------------------------------------------------------+
|        |  |     |  |     |  |     |  |     |  |     |  |        |
|  chod- |  | sam |  |     |  | sam |  |     |  | sam |  |  dalsze|
|  nik   |  | och |  |     |  | och |  |     |  | och |  |  pasy  |
|        |  | od  |  |     |  | od  |  |     |  | od  |  |        |
| drzewo |  |     |  |     |  |     |  |     |  |     |  |        |
| latar- |  | [v] |  |     |  | [v] |  |     |  |     |  |        |
| nia    |  |     |  |     |  |     |  |     |  |     |  |        |
|        |  |     |  |ZABA |  |     |  |     |  |     |  |        |
|        |  |     |  | [O] |  |     |  |     |  |     |  |        |
| [BARI] |  |     |  |     |  |     |  |     |  |     |  |        |
|        |  | [v] |  |[BAR]|  |     |  |     |  |     |  |        |
|        |  |     |  |     |  |     |  |     |  |     |  |        |
+--------+---------------------------------------------------------+
```

- **Chodnik (lewa)**: strefa startowa z drzewem, latarnia, ceglany mur (jak w Chicken Road)
- **Pasy ruchu**: szare tlo, biale przerywane linie, samochody jadace gora/dol
- **Wlazy kanalizacyjne**: na srodku kazdego pasa - szare (nieodwiedzony), zlote (przeszedl)
- **Barierki**: zolto-czarne, pojawiaja sie za zaba po przejsciu pasa
- **Kamera**: podaza za zaba w prawo, pokazujac ~5-7 pasow na raz

---

## Fazy implementacji

### Faza 1: Nowy uklad wizualny
**Cel: Zmiana wygladu z "prototype" na styl Chicken Road**

1. **Przebudowa renderera** - nowy system rysowania wzorowany na ukladzie CR
   - Chodnik po lewej (ceglany mur, drzewo, latarnia, trawa)
   - Pasy ruchu z przerywanymi liniami (jak w CR - biale kreski na szarym tle)
   - Wlazy kanalizacyjne na kazdym pasie (okragle, szare, z numerem pasa)
   - Wlazy zmienia sie na zlote po przejsciu
   - Barierki zolto-czarne (pojawiaja sie za zaba)
2. **Nowy system kolumn** - zamiast losowych grass/road:
   - Kolumna 0 = chodnik (zawsze bezpieczna, strefa startowa)
   - Kolumny 1+ = pasy ruchu (kazdy z samochodami)
   - Co 5 pasow = wysepka bezpieczna (checkpoint)
3. **Kamera** - plynne podazanie, chodnik widoczny z lewej

### Faza 2: Sprite'y i grafiki
**Cel: Zamiana rysowania kodem na sprite'y PNG**

1. **Zaba** (3 stany):
   - `frog_idle.png` - stoi spokojnie
   - `frog_jump.png` - w skoku (rozciagnieta)
   - `frog_crash.png` - uderzona (gwiazdy wokol glowy)
2. **Samochody** (5 typow, widok z gory):
   - `car_sedan.png` - maly samochod
   - `car_truck.png` - ciezarowka
   - `car_bus.png` - autobus
   - `car_police.png` - policja
   - `car_taxi.png` - taxi
3. **Tlo**:
   - `sidewalk.png` - chodnik z murem, drzewem, latarnia
   - `road_lane.png` - powtarzalny kafelek pasa ruchu
4. **Elementy UI**:
   - `manhole_normal.png` - wlaz szary (nieodwiedzony)
   - `manhole_passed.png` - wlaz zloty (przeszedl)
   - `barrier.png` - barierka zolto-czarna
5. **Efekty**:
   - `effect_crash.png` - dym/gwiazdy przy zderzeniu
   - `effect_safe.png` - zielony blask po bezpiecznym przejsciu

**Zrodlo grafik**: AI-generated (prompty w `doc/AI_IMAGE_PROMPTS.md`)

### Faza 3: Dzwieki (Web Audio API)
**Cel: Dodanie dzwiekow jak w Chicken Road (synteza, bez plikow audio)**

1. **Efekty dzwiekowe**:
   - `hop` - krotki dzwiek skoku (boing)
   - `land_safe` - bezpieczne ladowanie (pozytywny ton)
   - `crash` - zderzenie z samochodem (klaxon + crash)
   - `barrier_drop` - barierka opada za zaba
   - `game_over` - koniec gry (smutna melodia)
   - `new_record` - nowy rekord (fanfara)
2. **Muzyka w tle**: prosty loop (opcjonalnie)
3. **Modul audio**: `js/audio.js` - synteza przez Web Audio API (oscylatory, filtry)

### Faza 4: UI i ekrany
**Cel: Profesjonalny interfejs wzorowany na CR**

1. **Header** (gorny pasek):
   - Logo "FROGGY CROSS" (lewy gorny rog)
   - Wynik aktualny i rekord
   - Zycia (ikony serduszek)
   - Numer pasa (np. "Pas: 7")
   - Przycisk fullscreen
2. **Ekran startowy**:
   - Logo gry (duze, animowane)
   - Wybor trudnosci: Easy / Medium / Hard / Hardcore
   - Przycisk "GRAJ" (duzy, zielony, jak w CR)
   - Najlepszy wynik
3. **Ekran game over**:
   - Animacja crashu
   - Wynik koncowy + rekord
   - Przycisk "Sprobuj ponownie"
4. **Ekran pauzy** (ESC):
   - Wznow / Nowa gra / Menu glowne
5. **HUD w grze**:
   - Wynik (aktualny pas) - duzy, widoczny
   - Zycia
   - Numer trudnosci
   - Mini-mapa postepow? (opcjonalnie)

### Faza 5: Mechaniki gameplay
**Cel: Glebsza rozgrywka**

1. **System trudnosci** (jak w CR):
   - **Easy**: samochody wolne, duze przerwy, 10% szans na auto na pasie
   - **Medium**: srednia predkosc, mniejsze przerwy, 20%
   - **Hard**: szybkie samochody, male przerwy, 35%
   - **Hardcore**: bardzo szybkie, minimalne przerwy, 50%
2. **Checkpointy**:
   - Co 5 pasow strefa bezpieczna (wysepka z drzewem)
   - Po smierci respawn na ostatnim checkpoincie (nie od poczatku!)
3. **Rosnaca trudnosc**:
   - Im dalej, tym wiecej samochodow i szybsze
   - Nowe typy przeszkod po pasie 10, 20, 30...
4. **Power-upy** (opcjonalnie, Faza 6):
   - Tarcza (1 darmowe uderzenie)
   - Spowolnienie (samochody zwalniaja na 5s)
   - Dodatkowe zycie
5. **Combo system**:
   - Szybkie przeskoki z rzedu = bonus do wyniku
   - Wizualny feedback (np. "x2!", "x3!")

### Faza 6: Polish i optymalizacja
**Cel: Wyglad i dzialanie na poziomie Chicken Road**

1. **Animacje**:
   - Plynny skok zaby (squash & stretch)
   - Barierka opada z gory z odbiciem
   - Wlaz zmienia kolor (szary → zloty) z animacja
   - Samochody maja cienie i lekki bounce
   - Efekty czasteczkowe przy crashu (gwiazdy, dym)
   - Ekran trzesie sie przy zderzeniu (screen shake)
2. **Responsywnosc**:
   - Canvas skaluje sie do okna przegladarki
   - Obsluga mobilna (dotyk, swipe)
   - Orientacja landscape na mobile
3. **Wydajnosc**:
   - Object pooling dla samochodow i efektow
   - Renderowanie tylko widocznych obiektow
   - Sprite batching
4. **Dane gracza**:
   - localStorage: rekord, wybrana trudnosc, mute
5. **Dostepnosc**:
   - Konfiguracja klawiszy
   - Pauza na blur (utrata focusu)

---

## Stany gry (techniczne)

```
MENU → PLAYING → GAME_OVER → MENU
              ↕
            PAUSED
```

1. **MENU** - ekran startowy, wybor trudnosci
2. **PLAYING** - gra aktywna, gracz steruje zaba
3. **PAUSED** - pauza (ESC)
4. **GAME_OVER** - koniec gry, wyswietlenie wyniku

### Stany zaby:
1. **IDLE** - stoi na pasie, czeka na input
2. **JUMPING** - w trakcie skoku na nastepny pas (animacja ~200ms)
3. **LANDING** - ladowanie na pasie (sprawdzenie kolizji)
4. **HIT** - uderzona przez samochod (animacja ~1s)
5. **DEAD** - utracila zycie, respawn na checkpoincie

---

## Struktura projektu (docelowa)

```
FroggyCross/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js           ← stale, trudnosci, kolory
│   ├── utils.js            ← seeded random, easing, helpers
│   ├── audio.js            ← [NOWY] Web Audio API synteza
│   ├── sprites.js          ← [NOWY] ladowanie i renderowanie sprite'ow
│   ├── lane.js             ← [ZMIANA z column.js] system pasow ruchu
│   ├── vehicle.js          ← [NOWY] klasa pojazdu
│   ├── frog.js             ← logika zaby (rozszerzona o stany)
│   ├── barrier.js          ← [NOWY] system barierek
│   ├── hud.js              ← [NOWY] UI w grze (wynik, zycia, header)
│   ├── renderer.js         ← rendering (przebudowany pod nowy uklad)
│   ├── input.js            ← obsluga wejscia
│   └── main.js             ← petla gry, stany, ekrany
├── assets/
│   ├── sprites/
│   │   ├── frog_idle.png
│   │   ├── frog_jump.png
│   │   ├── frog_crash.png
│   │   ├── car_sedan.png
│   │   ├── car_truck.png
│   │   ├── car_bus.png
│   │   ├── car_police.png
│   │   └── car_taxi.png
│   ├── backgrounds/
│   │   ├── sidewalk.png
│   │   └── road_lane.png
│   ├── ui/
│   │   ├── manhole_normal.png
│   │   ├── manhole_passed.png
│   │   ├── barrier.png
│   │   └── logo.png
│   └── effects/
│       ├── effect_crash.png
│       └── effect_safe.png
└── doc/
    ├── PLAN.md              ← ten plik
    └── AI_IMAGE_PROMPTS.md  ← prompty do generowania grafik
```

---

## Algorytmy kluczowe

### Generowanie pasow
Kazdy pas ruchu (lane) ma:
- `index` - numer pasa (1, 2, 3...)
- `vehicleCount` - ile samochodow (zalezy od trudnosci i numeru pasa)
- `vehicleSpeed` - predkosc (bazowa * mnoznik trudnosci * mnoznik pasa)
- `vehicleDirection` - gora lub dol (naprzemiennie)
- `isCheckpoint` - czy to strefa bezpieczna (co 5 pasow)

```
vehicleCount = base + floor(laneIndex / 10)
vehicleSpeed = baseSpeed * difficultyMultiplier * (1 + laneIndex * 0.02)
```

### Trudnosc
| Parametr | Easy | Medium | Hard | Hardcore |
|---|---|---|---|---|
| Bazowa predkosc aut | 0.8 | 1.2 | 1.8 | 2.5 |
| Bazowa ilosc aut/pas | 2 | 3 | 4 | 5 |
| Przerwa miedzy autami | Duza | Srednia | Mala | Minimalna |
| Zycia | 5 | 3 | 3 | 1 |
| Checkpointy co | 5 pasow | 5 pasow | 7 pasow | 10 pasow |

### Kolizje
- AABB (Axis-Aligned Bounding Box) z marginesem 6px
- Sprawdzane gdy zaba stoi LUB laduje po skoku
- Samochody sprawdzane tylko na aktualnym pasie zaby

---

## Kolejnosc prac (priorytet)

### Sprint 1 (MVP wizualny):
1. Przebudowa ukladu - chodnik + pasy ruchu (zamiast losowych kolumn)
2. Wlazy kanalizacyjne na pasach
3. Barierki za zaba
4. Nowy ekran startowy z wyborem trudnosci
5. System trudnosci (4 poziomy)

### Sprint 2 (Grafiki + Dzwiek):
1. Przygotowanie promptow AI do grafik
2. Wygenerowanie sprite'ow
3. System ladowania sprite'ow
4. Podmiana renderowania z kodu na sprite'y
5. Dodanie dzwiekow (Web Audio API)

### Sprint 3 (Gameplay):
1. Checkpointy (respawn na ostatnim)
2. Rosnaca trudnosc z postepem
3. Combo za szybkie przeskoki
4. Screen shake i efekty przy crashu
5. localStorage (rekord, ustawienia)

### Sprint 4 (Polish):
1. Responsywnosc (mobile, fullscreen)
2. Efekty czasteczkowe
3. Animacje UI (barierki, wlazy)
4. Muzyka w tle
5. Testowanie i bug-fixy

---

## Assets do wygenerowania (AI)

Szczegolowe prompty w `doc/AI_IMAGE_PROMPTS.md`.

### Podsumowanie:
- Zaba: 3 stany (idle, jump, crash) = **3 pliki**
- Samochody: 5 typow (widok z gory) = **5 plikow**
- Tlo: chodnik, pas ruchu = **2 pliki**
- UI: wlazy (2), barierka, logo = **4 pliki**
- Efekty: crash, safe = **2 pliki**
- **RAZEM: ~16 plikow graficznych**
