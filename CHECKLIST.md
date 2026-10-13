# Проверка: все видео и все даты тура задействованы

Сверка папок `Afisha/` (16 файлов) и корня (`video 1–3.mp4`) с `content.json` и разделами ТЗ. Дни недели всех датированных афиш совпадают с календарём, значит годы определены верно.

## Видео — 3 из 3 ✅

| # | Исходник | В репо | Длит. | Формат | Где в ТЗ |
|---|---|---|---|---|---|
| v01 | `video 1.mp4` | `assets/video/video-01.mp4` | 26.1s | 720×1280, звук | 05 Video — **центральный, главный**; постер в 08 Gallery |
| v02 | `video 2.mp4` | `assets/video/video-02.mp4` | 15.3s | **360×640**, звук | 05 Video — правый, ≤360px, под зерном; постер в 08 Gallery |
| v03 | `video 3.mp4` | `assets/video/video-03.mp4` | 18.0s | 720×1280, звук | 05 Video — левый (ч/б атмосфера); постер в 08 Gallery |

## Даты тура — 16 из 16 ✅

| id | Дата | Площадка · событие | Город | Афиша | В ТЗ |
|---|---|---|---|---|---|
| t01 | 17.11.2022 Thu | The Foundry | Manama, Bahrain | ✅ | 07 List + Cities · 08 |
| t02 | 02.12.2022 Fri | Klub 360 — Friday (w/ DJ Peekaboo) | Manama, Bahrain | ✅ | 07 · 08 |
| t03 | 31.12.2022 Sat | Elite Crystal Hotel — New Year's Eve | Juffair, Bahrain | ✅ | 07 · 08 |
| t04 | 26.01.2023 Thu | «H» — Weekend Party (host & special guest) | Manama, Bahrain | ✅ crop | 07 · 08 ⚠️ площадка |
| t05 | **FEB 2023** Sun | LNT — Sunday Mania | Manama, Bahrain | ✅ | 07 · 08 ⚠️ число |
| t06 | 24.02.2023 Fri | Alto Lounge — Terrace Takeover | Manama, Bahrain | ✅ | 07 · 08 |
| t07 | 28.02.2023 Tue | Social Monkey — Ladies Night | Manama, Bahrain | ✅ | 07 · 08 |
| t08 | **MAR 2023** Tue | Social Monkey — Ladies Night | Manama, Bahrain | ✅ | 07 · 08 ⚠️ число |
| t09 | 31.03.2023 Fri | Tommy Lee — w/ Stereoporno, Gate 13 | Saint Petersburg | ✅ crop | 07 · 08 |
| t10 | 08.04.2023 Sat | Buddha Room — GATE13 | Sevastopol | ✅ | 07 · 08 |
| t11 | 24.05.2023 Wed | Little Buddha — Technogen | Hurghada, Egypt | ✅ | 07 · 08 |
| t12 | 30.06.2023 Fri | The Circle — Fusion Friday, Eid Edition | Hurghada, Egypt | ✅ | 07 · 08 |
| t13 | 30.07.2023 Sun | Swiss Inn Resort — Lost Land Sunday | Hurghada, Egypt | ✅ | 07 · 08 |
| t14 | **~SEP 2023** Fri | The Circle — The Art of Melodic | Hurghada, Egypt | ✅ | 07 · 08 ⚠️ число |
| t15 | 27.10.2023 Fri | W Muscat, Wet Deck — Sound Waves | Muscat, Oman | ✅ crop | 07 · 08 |
| t16 | 09.11.2023 Thu | Siddharta Lounge by Buddha-Bar — Soirée | Muscat, Oman | ✅ | 07 · 08 |

**Итого по городам (для glass-папок):** Manama/Bahrain — 8 · Hurghada — 4 · Muscat — 2 · Saint Petersburg — 1 · Sevastopol — 1.

## Прочие материалы

| Материал | Использование |
|---|---|
| Пресс-фото 6/6 | 02 Manifest (press-02) · 04 Sound (press-04) · 08 Gallery (все 6) |
| Hero 2 / Hero / nagoo.jpg | 01 Hero desktop / запасной кадр, OG / 01 Hero mobile |
| Logo black / white | Рамка видоискателя, прелоадер; нужен SVG (TODO-2) |
| Старый промокит 1.jpg | Источник текста: био, таймлайн, жанры, контакты |
| Старый промокит 2.jpg | Только как исторический референс (лайм не используем) |
| Референсы 4/4 | Разобраны в DESIGN.md §1 |

## Чего не хватает ❌
- **Word-документ BIO** — в папке нет.
- **Пресс-релиз** — в папке нет.
- Даты 2024–2026 (архив обрывается на ноябре 2023).

## Правка клиента: таймлайн и резидентства

| Что | Было | Стало |
|---|---|---|
| 2009–2011 | Resident DJ, Buddha Bar, Egypt | Freelance DJ & Marketing Manager, Buddha Bar |
| 2024–2025 | The Foundry (резидент с ноября 2024) | The Foundry, Bahrain, `to: 2025` |
| 2025 — NOW | нет | Haus, Bahrain, Resident DJ (`needsConfirm`: роль уточняется) |
| Резидентства | 5 | **4**: Lomonosov Club, Tommy Lee Club, The Foundry, Haus |
| bio.short | residencies in Egypt, Russia and Bahrain | residencies in Russia and Bahrain |
| Hurghada | гиги в туре | остаются (это гиги, не резидентство) |
