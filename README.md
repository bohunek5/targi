# Targi — PRESCOT / KLUŚ / ELBA

Galeria: https://bohunek5.github.io/targi/

45 wizualizacji w 15 kompletnych seriach. Każda seria ma dokładnie trzy rzuty w kolejności 1–2–3. Na początku są „Tablety — opcja 1” (19) i „Tablety — opcja 2” (20), następnie koncepcje 16–18 i kompletne serie 6–15. Obie opcje tabletów mają własne ujęcia wnętrza i strony ELBA. Filtr „Tablety · 2 opcje” pokazuje sześć obrazów: https://bohunek5.github.io/targi/?tablety=1 .

Przy pierwszym rzucie opcji 2 jest dodatkowy front portalu: produkcja po lewej, fotometria po prawej, linie LOW / MEDIUM / HIGH na suficie. Pliki, opis oraz prompty imagegen są w `versions/tablety/`. Niepełne wcześniejsze warianty usunięto z galerii; ich spis zachowano w `versions/archive-catalog.json`, a obrazy pozostają w `assets/`.

Strona ma widok trzech kafelków w rzędzie, pogrupowanych według koncepcji i serii, oraz widok listy, filtry rzutów i koncepcji, ulubione, powiększenie, porównanie z oryginałem, pobieranie pojedynczych plików i ZIP, dodawanie własnych obrazów oraz eksport i import danych.

Ulubione i własne obrazy są przechowywane wyłącznie w danej przeglądarce (localStorage i IndexedDB). Dodawanie obrazu nie publikuje go w repozytorium. Eksport JSON pozwala przenieść własne obrazy i ulubione na inne urządzenie. Czyszczenie danych witryny usuwa lokalne wybory; warto pobrać kopię.

Nowe wizualizacje powstały za pomocą wbudowanego imagegen, z oryginalnych renderów architektonicznych i materiałów klienta. W galeriach źródeł przy nowych obrazach są faktycznie wykorzystane fotografie i oficjalne logotypy. Są to koncepcje, nie pliki produkcyjne do druku; obrazowanie AI może zmieniać detale i liternictwo. Dokładny skład do druku wymaga oryginalnych materiałów.

## Pliki i uruchomienie

- `index.html` i `start.html`: ta sama galeria, działająca w katalogu projektu GitHub Pages.
- `catalog.js`: lista unikatowych obrazów i ich przyporządkowanie do rzutów.
- `assets/`: obrazy w pełnej rozdzielczości i materiały do pobrania.
- `thumbs/`: mniejsze podglądy do szybkiego przeglądania.
- `app.js`, `styles.css`: działanie i wygląd galerii, bez zewnętrznych bibliotek.

Lokalnie: `python3 -m http.server 8765 --bind 127.0.0.1`, następnie http://127.0.0.1:8765/ . Otwieranie HTML bez serwera umożliwia przeglądanie, ale przeglądarki mogą blokować zbiorcze pobieranie ZIP z adresów `file://`.

## Sprawdzenie

`python3 check_gallery.py` — wymaga Playwright i Chromium. Test sprawdza komplet 1–2–3 w każdej serii, dwa osobne komplety tabletów, filtr tabletów po odświeżeniu, dodatkowy front portalu, dostępność plików, ulubione, trzy kolumny i rozdzielenie koncepcji, listę, porównanie z oryginałem, integralność ZIP, dodawanie, eksport/import i brak poziomego przewijania na telefonie.

Publikacja GitHub Pages z gałęzi `main`, katalog `/`. Repozytorium jest oddzielone od pozostałych stron konta.
