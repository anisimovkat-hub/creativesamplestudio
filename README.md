# CSS webinar landing

Рабочая версия лендинга Creative Sample Studio для бесплатного вебинара **Fashion Brand as a System**.

## Что уже подготовлено

- исходник восстановлен из RTF-файла TextEdit и превращён в обычный HTML;
- семь встроенных изображений вынесены в `src/assets`;
- убрана зависимость формы от Netlify Forms;
- дата, идентификатор вебинара, цена записи и адрес оплаты вынесены в `src/config.js`;
- добавлены UTM-метки, раздельное согласие на маркетинг и информация о платной записи;
- добавлен автоматический выпуск статического сайта через GitHub Pages;
- подготовлен Google Sheet `CSS Webinar Leads & Attendance Tracker` для регистраций, посещаемости и продаж.

## Перед публикацией

В `src/config.js` нужно заполнить:

```js
window.CSS_WEBINAR_CONFIG = Object.freeze({
  webinarId: "WEB-2026-XX-XX",
  displayDate: "31 July 2026 · 4:00 PM BST",
  registrationEndpoint: "https://...",
  recordingPrice: 30,
  recordingCurrency: "USD",
  recordingCheckoutUrl: "https://buy.stripe.com/..."
});
```

`registrationEndpoint` должен быть публичным HTTPS-адресом серверной интеграции. API-ключи Brevo и Zoom нельзя добавлять в `config.js`, HTML, GitHub Pages или историю Git.

## Рекомендуемый поток регистрации

1. Человек заполняет форму на GitHub Pages.
2. Серверная интеграция создаёт уникального Zoom-регистранта.
3. Она добавляет/обновляет контакт в Brevo и сохраняет лид в Google Sheet.
4. Brevo отправляет служебное письмо с персональной Zoom-ссылкой от `marketing@creativesamplestudio.co.uk`.
5. После вебинара интеграция получает отчёт Zoom и отмечает в таблице `Attended` или `No-show`.

Для небольшого проекта серверной интеграцией может быть Google Apps Script или Cloudflare Worker. Для надёжной формы с понятной обработкой ошибок предпочтительнее небольшой Worker; Google Apps Script можно использовать для синхронизации таблицы и отчёта Zoom.

## Google Sheet

Рабочая таблица: <https://docs.google.com/spreadsheets/d/1DdiTWrzdHRATq1YD9nEPyH_7GimJp3ITkoGK0RpCHRc/edit>

Вкладки:

- `Overview` — сводка по регистрациям, посещаемости и продажам;
- `Leads` — одна строка на одного лида и один вебинар;
- `Webinars` — отдельные события и их настройки;
- `Lists` — допустимые статусы для выпадающих списков.

Строка `EXAMPLE-DELETE` — тестовый пример и не входит в метрики.

## Публикация

После создания отдельного репозитория:

1. загрузить этот каталог в ветку `main`;
2. в Settings → Pages выбрать Source: GitHub Actions;
3. дождаться завершения workflow `Deploy webinar landing to GitHub Pages`;
4. при необходимости подключить поддомен, например `webinar.creativesamplestudio.co.uk`.

Сайт публикуется из каталога `src`.
