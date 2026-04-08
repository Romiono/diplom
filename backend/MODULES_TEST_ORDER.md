# Порядок тестирования и отладки модулей

## Статус на 2026-03-22

Протестированы и отлажены:
- `blockchain` — полностью
- `auth` — полностью
- `transactions` — полностью
- `users` — полностью
- `listings` — полностью (протестировано 2026-03-22)
- `messages` — полностью (протестировано 2026-03-22)
- `admin` — полностью (протестировано 2026-03-22)

---

## Оставшиеся модули — порядок работы

### 1. `listings` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [CRIT] Утечка `auth_nonce`, `email`, `is_admin`, `is_active` продавца во всех публичных ответах → `select: false` на `auth_nonce` + явный выбор полей в QB
- [CRIT] Продавец мог удалить RESERVED листинг (активная транзакция) → статус-чек в `remove()`
- [HIGH] Забаненный пользователь (`is_active=false`) работал через JWT → проверка в `JwtStrategy.validate()`
- [HIGH] `getUserListings` не ограничивал `limit` → `Math.min(100, ...)` в контроллере
- [HIGH] Пустой/пробельный `title`/`description` принимался → `@IsNotEmpty()` в DTO
- [MED] Stored XSS — HTML не sanitize → `@Transform(stripHtml)` + `sanitize-html` в DTO
- [MED] `markAsSold`/`markAsDisputed` — нет проверки статуса → атомарный `WHERE status = 'reserved'`
- [MED] `price` возвращался строкой вместо числа → `transformer: parseFloat` в entity
- [MED] `minPrice > maxPrice` — нет валидации → `BadRequestException` в `search()`

**Нефиксированные (LOW):**
- Накрутка просмотров — нет дедупликации (Redis-дедуп — отдельная задача)
- `sortOrder` только `ASC`/`DESC` в верхнем регистре (минорная UX-проблема)
- `search_vector` — мёртвый столбец tsvector (технический долг)

---

### 2. `messages` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [CRIT] WebSocket без аутентификации → `OnGatewayConnection` с JWT-проверкой + `is_active`; неавторизованный сразу `disconnect(true)`
- [CRIT] Impersonation — `senderId` из тела сообщения → `sender_id` берётся из `socket.data.user.sub` (сессия), тело игнорируется
- [CRIT] `CORS: origin='*'` → origin-функция проверяет `FRONTEND_URL` из env
- [HIGH] `ValidationPipe` не применялся к WS → `@UsePipes(ValidationPipe)` на классе gateway
- [HIGH] Нет максимальной длины сообщения → `@MaxLength(5000)` в DTO
- [HIGH] Сообщение самому себе → проверка `senderId === receiver_id` в сервисе
- [HIGH] `chat:join` / `message:typing` — нет DTO и валидации → `JoinChatDto`, `TypingDto` с `@IsUUID()`
- [HIGH] `userId` в typing из тела (fake) → берётся из `socket.data.user.sub`
- [MED] Stored XSS в content → `@Transform(stripHtml)` + `sanitize-html` в DTO

**Нефиксированные (LOW/INFO):**
- Rate limiting на WS (Redis throttle — отдельная задача)
- `getUserChats` без пагинации (мёртвый код, не экспонирован)
- `getListingMessages`/`markAsRead` — не экспонированы через gateway (технический долг)

**Примечание**: `handleConnection` работает асинхронно, поэтому забаненный пользователь получает `connect`-событие (~мс), но немедленно `disconnect`. Для zero-window блокировки нужен `server.use()` middleware в `IoAdapter`.

---

### 3. `admin` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [HIGH] `isAdmin` брался из JWT-payload, не из DB → любой мог форжировать токен с `isAdmin:true`; теперь `JwtStrategy.validate()` читает `is_admin` из DB
- [HIGH] Привилегии после отзыва (`is_admin=false` в DB) продолжали работать через старый JWT → то же исправление в стратегии
- [HIGH] Администратор мог забанить самого себя → проверка `adminId === userId` → 403
- [HIGH] Администратор мог забанить другого администратора → проверка `user.is_admin` → 403
- [HIGH] `banUser` принимал пустой `reason` (raw `@Body('reason')`) → заменён на `BanUserDto` с `@IsNotEmpty() @MaxLength(500)`
- [MED] `resolveDispute` бросал `NotFoundException` для неправильного статуса → исправлено на `BadRequestException`
- [MED] `resolveDispute` и `banUser` принимали не-UUID параметры → добавлен `ParseUUIDPipe`
- [MED] `resolveDispute` вызывал blockchain при `escrow_contract_address = null` → 400 с понятным сообщением
- [MED] `getDisputes` возвращал `email`, `is_admin` продавца/покупателя → явный select публичных полей через QB
- [MED] Отсутствовал эндпоинт `/admin/users/:id/unban` → добавлен `unbanUser()` + `POST /admin/users/:id/unban`

**Нефиксированные (LOW/INFO):**
- `getDisputes` без пагинации (LOW, отдельная задача)
- Лог AdminAction не хранит IP-адрес инициатора (INFO)
- Нет эндпоинта для просмотра истории admin_actions (INFO)

---

### 4. `files` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [HIGH] Расширение из `originalname` (client-controlled) → файл сохранялся как `UUID.php` и т.п. → теперь расширение берётся из MIME-to-ext маппинга по реально детектированному типу
- [HIGH] MIME проверялся по `file.mimetype` (HTTP-заголовок клиента) → PNG/SVG/JS с `Content-Type: image/jpeg` проходили валидацию → теперь `fileTypeFromBuffer` (magic bytes) определяет реальный тип
- [HIGH] `sharp()` без try/catch → невалидный буфер → 500 → обёрнут в try/catch, кидает `BadRequestException`
- [MED] Нет статической раздачи файлов: URL из ответа возвращал 404 → добавлен `ServeStaticModule` (`/uploads/*`)
- [MED] Ответ возвращал `file.originalname` и `file.mimetype` (client-controlled) → теперь только детектированный `mimeType` и нет `filename`
- [LOW] `deleteImage()` без защиты от path traversal → добавлена проверка через `path.resolve` + `startsWith`

**Нефиксированные (LOW):**
- Двойная проверка размера: Multer (413) vs сервис (400) — несогласованность в коде ответов (минорная)

---

### 5. `reviews` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [HIGH] Stored XSS в `comment` → `@Transform(stripHtml)` + `sanitize-html` в DTO
- [HIGH] Утечка `is_admin`, `is_active`, `email_verified`, `updated_at` через relation-load → QueryBuilder с явным выбором 8 публичных полей в обоих read-эндпоинтах
- [HIGH] Нет `MaxLength` на `comment` → `@MaxLength(2000)` в DTO
- [MED] `getTransactionReviews` — нет проверки участника → добавлена проверка `buyer_id/seller_id`; третьи лица получают 403
- [MED] `getUserReviews` возвращал полные transaction данные (dispute_reason, buyer_id и т.д.) → убрана relation `transaction` из загрузки
- [MED] Нет `ParseUUIDPipe` на параметры → 500 → заменено на 400

**Проверено и работает корректно:**
- Проверка статуса `completed` (pending/disputed/refunded → 403) ✅
- Защита от дублей (ConflictException) ✅
- Проверка участника при создании отзыва ✅
- Диапазон рейтинга 1-5, целое число ✅

**Нефиксированные (LOW):**
- Нет пагинации в `getUserReviews`

---

### 6. `categories` — ✅ готово

**Найдено и исправлено (2026-03-22):**
- [MED] Non-integer `:id` → 500 на публичном эндпоинте → `ParseIntPipe` на все параметры `:id`
- [MED] Stored XSS в `name` (публично читаемом) → `@Transform(stripHtml)` на `name` и `description`
- [MED] Нет `@IsNotEmpty()` на `name`/`slug` → пустые строки принимались → добавлено
- [MED] Нет `MaxLength` на `description` → принимала 5000 симв. → `@MaxLength(1000)`
- [MED] Дублирующийся `slug` → 500 → try/catch в `create`/`update`, код `23505` → 409
- [LOW] Slug с пробелами/спец. символами → `@Matches(/^[a-z0-9-]+$/)` в DTO

---

### 7. `notifications` — ✅ реализовано (2026-03-22)

**Реализовано:**
- Entity `EmailNotification` → существующая таблица `email_notifications` (outbox-паттерн)
- Bull queue `email` — async обработка с retry (3 попытки, exponential backoff)
- Nodemailer processor — компилирует Handlebars-шаблон, отправляет письмо, обновляет статус/attempts в DB
- 6 Handlebars-шаблонов: `transaction-created`, `transaction-paid`, `transaction-completed`, `transaction-disputed`, `transaction-refunded`, `dispute-admin`
- `NotificationsService` — 5 публичных методов для транзакционных событий + `getUserNotifications()`
- `GET /notifications` — история email-уведомлений текущего пользователя (pagination)
- Graceful degradation при недоступном Redis: запись в DB всегда, queue.add() в try/catch
- **Интеграция с TransactionsService**: create, updatePaymentStatus, confirmReceipt, openDispute
- **Интеграция с AdminService**: resolveDispute (REFUND → refunded email, RELEASE → completed email)
- Уведомления fire-and-forget (`.catch(() => {})`): не блокируют основные операции

---

## Сводная таблица

| # | Модуль | Приоритет | Статус | Главная причина |
|---|--------|-----------|--------|-----------------|
| 1 | `listings` | 🔴 P0 | ✅ готово | Утечка данных продавца, транзакции |
| 2 | `messages` | 🔴 P0 | ✅ готово | WebSocket без аутентификации, impersonation |
| 3 | `admin` | 🟠 P1 | ✅ готово | isAdmin из JWT, self/admin ban, unban endpoint |
| 4 | `files` | 🟠 P1 | ✅ готово | MIME bypass, расширение из originalname, sharp 500, нет static serving |
| 5 | `reviews` | 🟡 P2 | ✅ готово | Stored XSS, утечка is_admin, нет ownership check |
| 6 | `categories` | 🟢 P3 | ✅ готово | ParseIntPipe, XSS, IsNotEmpty, ConflictException |
| 7 | `notifications` | ➕ new | ✅ реализовано | Bull queue, Nodemailer, Handlebars, 5 событий, HTTP API |
