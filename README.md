# Targi — PRESCOT / KLUŚ / ELBA

Galeria: https://bohunek5.github.io/targi/

60 wizualizacji w 15 kompletnych wariantach, ponumerowanych 01–15. Każdy ma trzy rzuty: 1 · narożnik, 2 · wnętrze, 3 · KLUŚ / ELBA oraz osobną pozycję „Portal — środek”. Na komputerze wszystkie cztery ujęcia wariantu są w jednym rzędzie; na mniejszych ekranach układ przechodzi do dwóch lub jednej kolumny.

Warianty 01 i 02 to dwie opcje tabletów. Filtr „Tablety · 2 opcje” pokazuje osiem obrazów: https://bohunek5.github.io/targi/?tablety=1 . Sam widok portali: https://bohunek5.github.io/targi/#4 . Numery źródłowych koncepcji pozostają wewnętrznymi identyfikatorami, dzięki czemu zachowano ulubione dotychczasowych obrazów.

Portal jest przejściem otwartym na przestrzał: bez tylnej ściany, z pustą podłogą i widokiem alejki za wyjściem. Dekoracja obejmuje wyłącznie boki i sufit. Każdy wariant ma własne ujęcie dopasowane do swojej grafiki oraz trzy linie światła na suficie LOW / MEDIUM / HIGH. Nieaktualny dodatkowy załącznik zamkniętego portalu usunięto. Nowe pliki i prompty są w `versions/portale/`.

Strona ma filtry rzutów i koncepcji, reset filtrów, ulubione, widok listy, powiększenie, porównanie rzutów 1–3 z oryginałem, pobieranie pojedynczych plików i ZIP, dodawanie własnych obrazów oraz eksport i import danych. Materiały i logotypy najpierw otwierają podgląd, w którym jest przycisk pobierania. Dodane obrazy usuwa się jednym kliknięciem, bez okna potwierdzenia.

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

`python3 check_gallery.py` — wymaga Playwright i Chromium. Sprawdza 15 kompletów: rzuty 1–3 + portal, numerację 01–15, dwa zestawy tabletów, cztery kolumny, filtr portali i brak fałszywego porównania z oryginałem dla portalu, dostępność plików, ulubione, pobieranie ZIP, dodawanie i import portalu, trwałe usuwanie bez potwierdzenia oraz układ mobilny.

Publikacja GitHub Pages z gałęzi `main`, katalog `/`. Repozytorium jest oddzielone od pozostałych stron konta.
