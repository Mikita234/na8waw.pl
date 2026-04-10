# na8waw.pl

Стартовый каркас проекта с автодеплоем из git через GitHub Actions на shared hosting przez FTPS.

## Структура

- `site/` - файлы сайта, которые публикуются на хостинг
- `.github/workflows/deploy.yml` - автодеплой при пуше в `main`

## Что уже настроено

1. Git-репозиторий и базовая структура проекта.
2. Автодеплой по `push` в ветку `main`.
3. Публикация `site/` на hosting przez `SamKirkland/FTP-Deploy-Action`.

## Параметры хостинга

Судя по панели:

- FTP host: `hosting2658608.online.pro`
- FTP login: `hosting2658608`
- FTPS port: `990`
- domena: `na8waw.pl`

В workflow заложен `protocol: ftps-legacy`, потому что порт `990` обычно означает implicit FTPS. Если хостинг в логах GitHub Actions начнет отваливаться по TLS, первый кандидат на проверку: сменить протокол на `ftps` и порт на `21`.

## Что нужно заполнить в GitHub Secrets

В репозитории GitHub добавь:

- `FTP_USERNAME` - обычно `hosting2658608`
- `FTP_PASSWORD` - пароль от FTP
- `FTP_SERVER_DIR` - папка на сервере для сайта, сначала попробуй `/`

## Как это работает

При пуше в `main` GitHub Actions:

1. Забирает код репозитория.
2. Подключается к `hosting2658608.online.pro`.
3. Загружает содержимое `site/` в папку `FTP_SERVER_DIR`.
4. Удаляет на сервере файлы, которых уже нет локально.

## Как быстро проверить

1. Создай репозиторий на GitHub.
2. Запушь этот проект в ветку `main`.
3. Добавь secrets.
4. Запусти workflow вручную через `workflow_dispatch`.
5. Если сайт не появился, проверь правильность `FTP_SERVER_DIR`.

## Дальше

- Найти точную docelową папку на hostingu, если `/` окажется не той директорией.
- Подменить заглушку в `site/` на реальный сайт.
- При необходимости добавить сборку фронтенда перед деплоем.

## Wishes MVP

Добавлен каркас пожеланий для мероприятия на `PHP + MySQL`:

- `site/wishes/submit.php` - прием пожеланий
- `site/wishes/feed.php` - JSON для live-экрана
- `site/wishes/admin.php` - ручная модерация
- `site/wishes/live.php` - экран с бегущей строкой
- `site/wishes/schema.sql` - схема таблицы
- `site/wishes/config.example.php` - пример конфига

### Как включить

1. Создай MySQL-базу в панели хостинга.
2. Выполни SQL из `site/wishes/schema.sql`.
3. Скопируй `site/wishes/config.example.php` в `site/wishes/config.php`.
4. Заполни там доступ к базе и логин/пароль админки.
5. После деплоя открой:

- `/wishes/admin.php` - модерация
- `/wishes/live.php` - экран для проектора

### Что уже работает

- На главной есть блок отправки пожелания без модалки.
- Пожелание попадает в очередь `pending`.
- В админке можно `approve / reject / pending`.
- На `live.php` крутятся только одобренные сообщения.

### Что важно

- `site/wishes/config.php` не хранится в git и добавлен в `.gitignore`.
- На текущей машине не удалось прогнать `php -l`, потому что `php` не установлен в PATH.
