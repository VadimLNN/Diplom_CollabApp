# Сервер Collab App

Серверная часть состоит из Express REST API и отдельного Hocuspocus-сервера.
Оба процесса используют PostgreSQL: REST API хранит доменные данные, а
Hocuspocus сохраняет бинарные снимки Yjs-документов.

## Архитектура

Основной поток обработки REST-запроса:

```text
route -> middleware/validator -> service -> repository -> PostgreSQL
```

| Каталог | Назначение |
| --- | --- |
| `routes/` | HTTP-маршруты и формирование ответов |
| `middleware/` | JWT-аутентификация, роли, доступ и обработка ошибок |
| `validators/` | Проверка внешнего ввода |
| `services/` | Бизнес-правила |
| `repositories/` | Параметризованные SQL-запросы |
| `realtime/` | Конфигурация Hocuspocus и persistence Yjs |
| `scripts/` | Инициализация БД и запуск realtime-сервера |

## REST API

Основные группы маршрутов:

- `/api/auth` — регистрация, вход, refresh, logout и настройки аккаунта;
- `/api/projects` — проекты и создание вкладок;
- `/api/projects/:projectId/tabs/:tabId` — чтение, обновление и удаление
  вкладки;
- `/api/projects/:projectId/permissions` — роли и участники проекта.

Swagger UI доступен по адресу `/api-docs`.

Защищенные запросы используют access token из заголовка
`Authorization: Bearer ...`. Refresh token хранится в cookie.

## Доступ

Проект поддерживает роли `owner`, `editor` и `viewer`.

- `authMiddleware` проверяет access token;
- `checkProjectAccess` проверяет участие пользователя в проекте;
- `hasRole` ограничивает операции по роли;
- `collabAccessService` выполняет аналогичную проверку для WebSocket.

Проверка прав должна выполняться для каждой операции записи, независимо от
того, скрыта ли кнопка на клиенте.

## Realtime

Hocuspocus запускается отдельным процессом и принимает подключения по пути
`/api/collab`.

При подключении сервер:

1. проверяет JWT;
2. находит вкладку по `ydoc_document_name`;
3. определяет проект и роль пользователя;
4. разрешает или запрещает запись;
5. загружает Yjs-состояние из PostgreSQL;
6. сохраняет обновленные бинарные снимки документа.

Текстовые документы и доски используют один транспорт, но разные структуры
данных внутри Yjs.

## База данных

Схема находится в `db.sql` и содержит:

- `users`;
- `projects`;
- `project_permissions`;
- `tabs`;
- `yjs_documents`;
- `yjs_document_save_events`.

Поддерживаемые типы вкладок: `text` и `board`.

Связанные данные удаляются каскадно. Новый SQL должен находиться в repository-
слое и использовать параметры `$1`, `$2` и далее.

`npm run db:init` создает отсутствующие таблицы, но не является системой
миграций для уже существующей базы.

## Переменные окружения

```dotenv
NODE_ENV=development
PORT=5000
HOCO_PORT=1234
CLIENT_URL=http://localhost:5173

JWT_SECRET=local-access-secret
JWT_REFRESH_SECRET=local-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_DATABASE=diplom_db
DB_TEST_DATABASE=diplom_db_test
```

Для подключения к PostgreSQL также поддерживается `DATABASE_URL`.

## Команды

Установка и инициализация:

```bash
npm ci
npm run db:init
```

Запуск REST API:

```bash
npm run dev
```

Запуск Hocuspocus:

```bash
npm run dev:hocuspocus
```

Другие команды:

```bash
npm start
npm run hocuspocus
npm test
npm run scan:all
```

По умолчанию REST API использует порт `5000`, а realtime-сервер — `1234`.

## Изменение контрактов

При изменении маршрутов, ролей, auth flow или типов вкладок необходимо
синхронизировать:

- Express-маршруты и middleware;
- сервисы и репозитории;
- клиентские API-вызовы;
- WebSocket-аутентификацию;
- `db.sql`;
- Swagger-документацию.

Сервер не должен возвращать клиенту внутренние ошибки, SQL, токены, cookie или
другие секретные данные.
