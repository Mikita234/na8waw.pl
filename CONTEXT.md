# na8waw.pl Context

## Project

- Event landing for `na8waw.pl`
- Shared hosting at `nazwa.pl`
- Deploys from GitHub Actions to hosting via FTPS
- Main languages: `ru` and `uk`

## Deployment

- Main deploy workflow: [`.github/workflows/deploy.yml`](/Users/imac/Desktop/na8waw/.github/workflows/deploy.yml)
- Daily auto-update workflow: [`.github/workflows/update-ru-daily.yml`](/Users/imac/Desktop/na8waw/.github/workflows/update-ru-daily.yml)
- Daily updater script: [`scripts/update-daily.mjs`](/Users/imac/Desktop/na8waw/scripts/update-daily.mjs)
- Daily is tied to Warsaw date logic (`Europe/Warsaw`)

## Primary Pages

- Root Russian default: [`site/index.html`](/Users/imac/Desktop/na8waw/site/index.html)
- Russian explicit page: [`site/ru.html`](/Users/imac/Desktop/na8waw/site/ru.html)
- Ukrainian explicit page: [`site/uk.html`](/Users/imac/Desktop/na8waw/site/uk.html)
- Daily pages:
  - [`site/daily/ru.html`](/Users/imac/Desktop/na8waw/site/daily/ru.html)
  - [`site/daily/uk.html`](/Users/imac/Desktop/na8waw/site/daily/uk.html)
- Program pages:
  - [`site/program/ru.html`](/Users/imac/Desktop/na8waw/site/program/ru.html)
  - [`site/program/uk.html`](/Users/imac/Desktop/na8waw/site/program/uk.html)
- Oracle share pages:
  - [`site/oracle/ru.html`](/Users/imac/Desktop/na8waw/site/oracle/ru.html)
  - [`site/oracle/uk.html`](/Users/imac/Desktop/na8waw/site/oracle/uk.html)

## Frontend Modules

- Main page behavior: [`site/scripts/main.js`](/Users/imac/Desktop/na8waw/site/scripts/main.js)
- Locale strings: [`site/scripts/locale-data.js`](/Users/imac/Desktop/na8waw/site/scripts/locale-data.js)
- Locale switching: [`site/scripts/locale.js`](/Users/imac/Desktop/na8waw/site/scripts/locale.js)
- Daily logic: [`site/scripts/daily.js`](/Users/imac/Desktop/na8waw/site/scripts/daily.js)
- Oracle logic: [`site/scripts/predictions.js`](/Users/imac/Desktop/na8waw/site/scripts/predictions.js)
- Main styles: [`site/styles/main.css`](/Users/imac/Desktop/na8waw/site/styles/main.css)

## Current UX / Structure

- Hero with NA8 visual, dates, locale switch, CTA to oracle/program
- First content row: oracle + about
- Second content row: daily + utility/info block
- Third content row: program + contacts
- Final block: locations/maps
- Mobile sticky mini-nav exists with anchors:
  - prediction
  - daily
  - program
  - contacts

## Daily Logic

- `uk` daily comes from local source data committed to repo
- `ru` daily is fetched from `https://na-russia.org/meditation-today`
- Auto-update runs around Warsaw midnight using GitHub Actions cron
- Primary daily URLs are:
  - `/daily/ru.html`
  - `/daily/uk.html`

## SEO / Share Rules

- Root `/` is intentionally Russian default
- Ukrainian primary share URL is `/uk.html`
- Daily pages use one common preview image source now:
  - `https://na8waw.pl/media/na8.png`
- Goal is symmetric behavior:
  - `ru URL -> ru meta + ru body`
  - `uk URL -> uk meta + uk body`

## Wishes Feature

Wishes were removed from homepage and moved off-page.

Backend/files:

- Public page: [`site/wishes/index.php`](/Users/imac/Desktop/na8waw/site/wishes/index.php)
- Admin: [`site/wishes/admin.php`](/Users/imac/Desktop/na8waw/site/wishes/admin.php)
- Live ticker: [`site/wishes/live.php`](/Users/imac/Desktop/na8waw/site/wishes/live.php)
- Submit endpoint: [`site/wishes/submit.php`](/Users/imac/Desktop/na8waw/site/wishes/submit.php)
- Feed endpoint: [`site/wishes/feed.php`](/Users/imac/Desktop/na8waw/site/wishes/feed.php)
- Bootstrap/config loader: [`site/wishes/bootstrap.php`](/Users/imac/Desktop/na8waw/site/wishes/bootstrap.php)
- SQL schema: [`site/wishes/schema.sql`](/Users/imac/Desktop/na8waw/site/wishes/schema.sql)
- Config example: [`site/wishes/config.example.php`](/Users/imac/Desktop/na8waw/site/wishes/config.example.php)
- Frontend form helper: [`site/scripts/wishes.js`](/Users/imac/Desktop/na8waw/site/scripts/wishes.js)

Notes:

- `site/wishes/config.php` is intentionally gitignored
- Wishes require MySQL setup on hosting

## Recent Commits

- `446c28b` Restore desktop content grid balance
- `179cd45` Refine daily SEO and move wishes off homepage
- `fc2f591` Add wishes moderation and live ticker

## Known Intent / Constraints

- User prefers direct, pragmatic iteration with immediate push to `main`
- User is sensitive to:
  - visual regressions on desktop/mobile
  - broken locale behavior
  - Telegram/SEO preview inconsistencies
  - overengineered or weak copy
- `Предсказание` wording is intentional because it references the magic-ball concept

## Current Open Checkpoint

Things worth re-checking after latest changes:

1. Daily `ru/uk` preview consistency in Telegram after cache-busting
2. Desktop composition after restoring two-column rows
3. Mobile spacing after layout changes
4. Root `/` vs `/ru.html` parity
5. Locations block behavior as final section after contacts
