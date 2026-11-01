# VALERI HAIR STUDIO — памятка для Claude

Сайт valerihairstudio.ru: статический HTML/CSS/JS, GitHub Pages из ветки `main`.
Владелец — не программист: отвечать по-русски, простыми словами, одной рекомендацией.

## Нельзя
- Сливать что-либо в `main` без явного «сливай» от владельца. Работа идёт в ветке
  `redesign`, проверка — на закрытой тестовой версии Vercel (проект `valeri-redesign-preview`).
- Менять или удалять `CNAME`, `robots.txt`, `sitemap.xml`, `yandex_5319b350c3bce2f4.html`,
  `googled40ef8e07ef6d216.html`. Удалять файлы из `assets/`.
- Выдумывать цены, процедуры, отзывы, рейтинги и факты. «Улучшать» нейросетью фото
  «до/после», Валерии и учениц.
- Менять ссылку записи `https://dikidi.net/#widget=220056` и подключение её скрипта.

## Как устроено
- `index.html` — весь текст сайта; `site.css` — стили (разделы пронумерованы в шапке файла);
  `main.js` — анимации (GSAP 3 + ScrollTrigger + SplitText + Lenis из `assets/vendor/`);
  `sign.js` — объёмная золотая вывеска на WebGL во вступлении.
- Старые `styles-base.css`, `styles.css`, `results-overrides.css`, `script-base.js`,
  `script.js` больше не подключены, но не удалены.
- После правок CSS/JS увеличить `?v=` в ссылке на файл в `index.html` (сброс кэша).
- Без JS и в режиме «уменьшить движение» всё должно быть видно сразу (`html.motion`).
- Для работы с анимацией загружать навык `premium-motion-sites`.
