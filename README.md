# Collab App

Collab App — full-stack приложение для совместной работы над проектами.
Пользователи создают проекты, приглашают участников, назначают им роли и
редактируют общее содержимое в реальном времени.

В проекте поддерживаются два типа вкладок:

- `text` — rich-text документ на Tiptap;
- `board` — интерактивная доска на Excalidraw.

Состояние обеих вкладок синхронизируется через Yjs и Hocuspocus.

## Как устроено приложение

Приложение состоит из трех независимо запускаемых процессов:

```text
React-клиент ── HTTP ──> Express REST API ──> PostgreSQL
      │
      └── WebSocket ──> Hocuspocus ────────> Yjs-снимки в PostgreSQL
```

| Часть | Расположение | Назначение |
| --- | --- | --- |
| Клиент | `client/` | Интерфейс, маршрутизация, формы и редакторы |
| REST API | `server/server.js` | Авторизация, проекты, вкладки и участники |
| Realtime-сервер | `server/scripts/startHocuspocus.js` | Синхронизация Yjs-документов |
| База данных | `server/db.sql` | Пользователи, проекты, роли, вкладки и Yjs-состояние |

Подробнее:

- [документация клиента](client/README.md);
- [документация сервера](server/README.md).

## Роли

Доступ выдается на уровне проекта:

| Роль | Возможности |
| --- | --- |
| `owner` | Полный доступ, настройки проекта и управление участниками |
| `editor` | Просмотр и редактирование содержимого |
| `viewer` | Только просмотр |

Ограничения проверяются сервером отдельно для REST и WebSocket. Проверки на
клиенте используются только для управления интерфейсом.

## Требования

- современная LTS-версия Node.js, совместимая с Vite 7;
- npm;
- PostgreSQL.

## Настройка окружения

Создайте `server/.env`:

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

Вместо набора `DB_*` можно использовать `DATABASE_URL`.

Создайте `client/.env`:

```dotenv
VITE_BACKEND_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:1234/api/collab
```

Переменные `VITE_*` попадают в браузерную сборку, поэтому в них нельзя хранить
секреты.

## Установка

```bash
cd server
npm ci

cd ../client
npm ci
```

Инициализация схемы базы данных:

```bash
cd server
npm run db:init
```

Команда создает отсутствующие таблицы, но не заменяет полноценные миграции и
не изменяет автоматически уже существующие столбцы.

## Запуск

Каждый процесс запускается в отдельном терминале.

REST API:

```bash
cd server
npm run dev
```

Realtime-сервер:

```bash
cd server
npm run dev:hocuspocus
```

Клиент:

```bash
cd client
npm run dev
```

После запуска доступны:

- клиент: <http://localhost:5173>;
- REST API: <http://localhost:5000>;
- Swagger UI: <http://localhost:5000/api-docs>;
- WebSocket: `ws://localhost:1234/api/collab`.

## Основные сценарии

1. Пользователь регистрируется или входит в систему.
2. Создает проект и становится его владельцем.
3. Приглашает участников как `editor` или `viewer`.
4. Создает текстовую вкладку или доску.
5. Клиенты подключаются к одному Yjs-документу через Hocuspocus.
6. Изменения синхронизируются между открытыми сессиями и сохраняются в
   PostgreSQL.

Access token хранится в `localStorage` и отправляется в заголовке
`Authorization`. Refresh token хранится в `httpOnly` cookie.

## Структура репозитория

```text
.
├── client/
│   ├── src/app/
│   ├── src/entities/
│   ├── src/features/
│   ├── src/pages/
│   ├── src/shared/
│   └── src/widgets/
└── server/
    ├── middleware/
    ├── repositories/
    ├── routes/
    ├── services/
    ├── validators/
    ├── realtime/
    ├── scripts/
    └── db.sql
```

## Важные ограничения

- Источником истины для редакторов является Yjs, а не локальный React state.
- Каждая вкладка имеет уникальный `ydoc_document_name`.
- Изменения редакторов нужно вручную проверять минимум в двух браузерных
  сессиях.
- Не следует коммитить `.env`, секреты, `node_modules`, `dist`, логи и
  содержимое документов.
