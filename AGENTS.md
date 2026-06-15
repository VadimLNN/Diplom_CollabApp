# AGENTS.md

Инструкции для AI-агентов и разработчиков, которые вносят изменения в этот
репозиторий.

## 1. О проекте

Collab App — full-stack приложение для совместной работы над проектами.
Пользователь может создавать проекты, назначать участникам роли и совместно
редактировать вкладки двух типов:

- `text` — rich-text редактор на Tiptap + Yjs;
- `board` — доска на Excalidraw + Yjs.

Система состоит из трех независимо запускаемых процессов:

1. `client/` — React SPA, собираемая Vite;
2. `server/server.js` — Express REST API;
3. `server/scripts/startHocuspocus.js` — Hocuspocus WebSocket-сервер.

PostgreSQL хранит пользователей, проекты, права, вкладки и бинарные снимки
Yjs-документов.

## 2. Источники истины

Перед изменениями изучай фактический код и конфигурацию. Корневой `README.md`
содержит проектные и рекомендательные материалы, часть которых может отставать
от реализации.

Актуальные источники:

- npm-команды и зависимости: `client/package.json`, `server/package.json`;
- переменные окружения сервера: `server/config/env.js`;
- схема данных: `server/db.sql`;
- REST-маршруты: `server/app.js`, `server/routes/`;
- правила доступа: `server/middleware/`, `server/services/accessService.js`;
- realtime-аутентификация: `server/services/collabAccessService.js`;
- клиентские маршруты: `client/src/app/routes/index.jsx`;
- HTTP-клиент и refresh flow: `client/src/shared/api/axios.js`;
- подключение к Yjs: `client/src/shared/realtime/getHocusProvider.js`.

Не считай комментарии, Swagger-аннотации или README более надежными, чем
исполняемый код. Если меняется контракт, синхронизируй документацию с кодом.

## 3. Быстрый старт

Требуются Node.js, npm и PostgreSQL. Версия Node.js в репозитории пока не
зафиксирована; используй современную LTS-версию, совместимую с Vite 7 и
Express 5.

Устанавливай зависимости из lock-файлов:

```bash
cd client
npm ci

cd ../server
npm ci
```

Минимальные серверные переменные окружения:

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

Вместо набора `DB_*` допускается `DATABASE_URL`. Не публикуй реальные секреты
и не изменяй существующие `.env` без прямой необходимости.

Минимальные клиентские переменные:

```dotenv
VITE_BACKEND_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:1234/api/collab
```

Инициализация схемы:

```bash
cd server
npm run db:init
```

Запускай процессы в отдельных терминалах:

```bash
cd server && npm run dev
cd server && npm run dev:hocuspocus
cd client && npm run dev
```

REST API по умолчанию доступен на `http://localhost:5000`, Swagger UI — на
`http://localhost:5000/api-docs`, клиент — на `http://localhost:5173`.

## 4. Архитектурные границы

### Клиент

Клиент организован по мотивам Feature-Sliced Design:

- `app/` — провайдеры, маршрутизация, глобальные стили;
- `pages/` — сборка страниц и загрузка данных страницы;
- `widgets/` — крупные переиспользуемые блоки;
- `features/` — пользовательские сценарии и редакторы;
- `entities/` — модели и UI доменных сущностей;
- `shared/` — API-клиент, realtime-инфраструктура, UI-примитивы и утилиты.

Сохраняй направление зависимостей от верхних слоёв к нижним. Не переноси
бизнес-логику в `shared/ui` и не делай shared-модули зависимыми от страниц.

Используй существующий экземпляр Axios из `shared/api/axios.js`. Не создавай
параллельный auth flow и не обходи interceptor для защищенных запросов.

### Сервер

Предпочтительный поток вызова:

```text
route -> middleware/validator -> service -> repository -> PostgreSQL
```

- `routes/` принимает HTTP-запрос и формирует HTTP-ответ;
- `middleware/` выполняет аутентификацию и проверку доступа;
- `validators/` проверяет внешний ввод;
- `services/` содержит бизнес-правила;
- `repositories/` выполняет SQL-запросы;
- `error/AppError.js` и `middleware/errorHandler.js` задают ошибки API.

Новый SQL размещай в repository-слое и всегда параметризуй через `$1`, `$2`,
и т.д. Не собирай SQL из пользовательских строк.

Для новых async-маршрутов используй `asyncHandler` и передавай ошибки в общий
`errorHandler`, если окружающий код уже следует этой схеме. Не раскрывай
клиенту внутренние ошибки и секретные данные.

## 5. Авторизация и роли

В проекте три роли:

- `owner` — полный доступ к проекту и управление участниками;
- `editor` — чтение и редактирование содержимого;
- `viewer` — только чтение.

Проверка прав на клиенте нужна для UX, но не является защитой. Любая операция
записи должна быть повторно авторизована сервером.

При изменении доступа проверяй оба транспорта:

- REST: `authMiddleware`, `checkProjectAccess`, `hasRole`;
- WebSocket: `collabAccessService` и `onAuthenticate` Hocuspocus.

Access token передается в `Authorization: Bearer ...` и хранится клиентом в
`localStorage`. Refresh token хранится в `httpOnly` cookie. Изменения login,
refresh, logout, CORS, cookie options или обработки `401` должны быть
согласованы между сервером и `client/src/shared/api/axios.js`.

## 6. Realtime и Yjs

Каждая вкладка имеет уникальный `ydoc_document_name`. Это идентификатор
документа во всех слоях: таблица `tabs`, WebSocket-подключение и таблица
`yjs_documents`.

При работе с collaborative-редакторами:

- не заменяй Yjs-состояние локальным React state как источником истины;
- группируй связанные Yjs-изменения через `ydoc.transact`;
- помечай локальные транзакции origin-значением и игнорируй их в remote
  observers, чтобы не создавать циклы;
- отписывай observers, события provider и таймеры в cleanup;
- не записывай состояние до завершения первоначальной синхронизации;
- сохраняй read-only режим для `viewer` на UI и серверной стороне;
- не меняй имена Y.Map/Y.Array без стратегии миграции существующих документов.

Изменения `TextEditor`, `BoardEditor`, `useBoardCollaboration`,
`useBoardAwareness`, `getHocusProvider`, persistence или awareness требуют
ручной проверки минимум в двух браузерных сессиях.

## 7. База данных и API-контракты

Поддерживаемые типы вкладок определены одновременно в:

- `server/db.sql`;
- `server/validators/tabValidators.js`;
- `server/services/tabService.js`;
- `client/src/features/tabs/EditorRenderer.jsx`;
- UI создания вкладки.

При добавлении типа вкладки обновляй все эти места в одном изменении.

При изменении схемы:

- обнови `server/db.sql`;
- обнови repository/service-код;
- проверь каскадное удаление и индексы;
- добавь или обнови тестовый bootstrap;
- опиши миграцию для уже существующей БД.

`npm run db:init` выполняет `CREATE TABLE IF NOT EXISTS` и не является
полноценной системой миграций: изменение существующего столбца этим скриптом
автоматически не применится.

REST-маршруты вкладок имеют форму
`/api/projects/:projectId/tabs/:tabId`. При изменении URL синхронизируй
маршрут Express, клиентские вызовы, ссылки React Router и Swagger.

## 8. Стиль изменений

- Следуй стилю файла: клиент использует ES modules, сервер — CommonJS.
- Не конвертируй проект целиком в TypeScript или другой module format в рамках
  локальной задачи.
- Делай узкие изменения без нерелевантного рефакторинга.
- Используй существующие CSS-классы, дизайн-токены и UI-примитивы.
- Не добавляй зависимость, если задача решается текущим стеком или стандартной
  библиотекой.
- Новые пользовательские строки выдерживай в языке окружающего интерфейса.
- Не оставляй отладочные `console.log`, особенно с токенами, cookie, паролями
  или полным содержимым документов.
- Не редактируй `package-lock.json` вручную.
- Не коммить `node_modules`, `dist`, coverage, логи и секреты.

Существующий код неоднороден по форматированию и обработке ошибок. Улучшай
затронутую область, но не переформатируй несвязанные файлы.

## 9. Проверки

## 10. Критерии завершения

Изменение готово, когда:

- выполнен требуемый пользовательский сценарий;
- сохранены роли и границы доступа;
- согласованы клиент, REST API, realtime и схема БД;
- отсутствуют утечки секретов и непараметризованный SQL;
- документация обновлена, если изменились команды, env, маршруты или схема.
