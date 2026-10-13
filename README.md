# DJ NAGOO — Press Kit

E-press-kit (сайт-презентация) DJ NAGOO для букинг-агентств и промоутеров.

**Статус:** этап 1 — подготовка (ТЗ + дизайн-система + ассеты). Верстка — этап 2, в терминале.

| Файл | Что внутри |
|---|---|
| [`TZ.md`](TZ.md) | Техническое задание: стек, скиллы, 9 секций, компоненты 21st.dev, приёмка, вопросы |
| [`DESIGN.md`](DESIGN.md) | Дизайн-система: палитра, типографика, сетка, ритм, анимация, do/don't |
| [`CHECKLIST.md`](CHECKLIST.md) | Сверка: 3/3 видео и 16/16 дат задействованы |
| [`PRODUCT.md`](PRODUCT.md) | Контекст продукта для Impeccable |
| [`content/content.json`](content/content.json) | Весь контент сайта (био, таймлайн, тур, видео, контакты) |
| `public/assets/` | Оптимизированные WebP/MP4: hero, press, posters (16), video (3), logo, references |

## Старт верстки
```bash
npx impeccable install && npx skills add Leonxlnx/taste-skill
# затем в Claude Code: /impeccable init → читать TZ.md и DESIGN.md
```

## PDF-версия

Маршрут `/print` (или `?print=1`) отдаёт 10 слайдов 1920×1080: видео заменены постерами с QR, WebGL — статичным градиентом.

```bash
npm run build -- --base=/djnagoo/
npx vite preview --base=/djnagoo/ --port 4173
npm run pdf            # node scripts/export-pdf.mjs → DJ-NAGOO-press-kit.pdf
```

Нужен Chrome (`CHROME_PATH`) или `npx playwright-core install chromium`.
