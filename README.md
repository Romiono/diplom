# TON Marketplace - Торговая платформа на блокчейне TON

Fullstack web-приложение торговой площадки (аналог Avito) с интегрированной платежной системой на базе TON блокчейна и смарт-контрактов на FunC.

## 📋 Оглавление

- [О проекте](#о-проекте)
- [Архитектура](#архитектура)
- [Технологический стек](#технологический-стек)
- [Функциональность](#функциональность)
- [Структура проекта](#структура-проекта)
- [Установка и запуск](#установка-и-запуск)
- [Смарт-контракт](#смарт-контракт)
- [API Documentation](#api-documentation)
- [База данных](#база-данных)
- [Безопасность](#безопасность)
- [Разработка](#разработка)
- [TODO](#todo)

---

## О проекте

**TON Marketplace** - это децентрализованная P2P торговая платформа, где пользователи могут безопасно покупать и продавать товары используя TON криптовалюту. Все платежи защищены смарт-контрактами эскроу, что гарантирует безопасность сделок для обеих сторон.

### Ключевые особенности

- 🔐 **Аутентификация через TON Wallet** - вход через TonConnect
- 💰 **Эскроу смарт-контракты** - безопасное хранение средств до завершения сделки
- 💬 **Real-time чат** - общение между покупателем и продавцом через WebSocket
- ⚖️ **Система разрешения споров** - администраторы могут разрешать конфликты
- ⭐ **Рейтинг и отзывы** - репутационная система для пользователей
- 🔍 **Full-text поиск** - поиск товаров с фильтрацией и сортировкой
- 📱 **Адаптивный дизайн** - работает на всех устройствах

### MVP vs Production

Это **MVP версия** проекта, готовая к тестированию на TON testnet:

- ✅ Полностью рабочий backend API
- ✅ Готовые смарт-контракты (FunC + TypeScript wrappers)
- ✅ Все бизнес-модули реализованы
- ✅ **Реальная TON blockchain интеграция** (деплой контрактов, транзакции release/refund)
- ✅ REST API для тестирования блокчейна
- ⚠️ Frontend не реализован (только backend)
- ⚠️ Email уведомления не настроены
- ⚠️ Требуется компиляция контракта и настройка admin wallet

> **📖 Документация по тестированию:** См. [TEST_TON.md](TEST_TON.md) для полного руководства

---

## Архитектура

### Монолитная архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (TODO)                     │
│                Next.js + TonConnect UI                   │
└────────────────────┬────────────────────────────────────┘
                     │ REST API + WebSocket
┌────────────────────▼────────────────────────────────────┐
│                     NestJS Backend                       │
│  ┌──────────┬──────────┬──────────┬─────────────────┐  │
│  │  Auth    │ Listings │Messages  │   Transactions  │  │
│  │  Users   │Categories│ Reviews  │     Admin       │  │
│  │  Files   │Blockchain│Notifications                │  │
│  └──────────┴──────────┴──────────┴─────────────────┘  │
└────────────┬──────────────┬──────────────┬─────────────┘
             │              │              │
    ┌────────▼────┐  ┌──────▼──────┐  ┌───▼──────────┐
    │ PostgreSQL  │  │    Redis    │  │ TON Testnet  │
    │  Database   │  │   (Cache)   │  │  Blockchain  │
    └─────────────┘  └─────────────┘  └──────────────┘
```

### Основные компоненты

1. **Backend API** (NestJS)
   - REST endpoints для CRUD операций
   - WebSocket для real-time чата
   - JWT аутентификация
   - TypeORM для работы с БД

2. **База данных** (PostgreSQL)
   - 12+ таблиц с связями
   - Full-text search индексы
   - Миграции через TypeORM

3. **Blockchain интеграция** (TON)
   - Смарт-контракты на FunC
   - TypeScript wrappers
   - TonConnect для аутентификации

4. **Кеширование** (Redis)
   - Сессии пользователей
   - Rate limiting
   - WebSocket rooms
   - Bull queues для async задач

---

## Технологический стек

### Backend

| Технология | Версия | Назначение |
|------------|--------|------------|
| **NestJS** | 10.x | Web framework (TypeScript) |
| **TypeORM** | 0.3.x | ORM для PostgreSQL |
| **PostgreSQL** | 16 | Основная база данных |
| **Redis** | 7.x | Кеширование, очереди |
| **Passport.js** | - | JWT аутентификация |
| **Socket.IO** | 4.x | WebSocket для чатов |
| **Bull** | 4.x | Очереди для async задач |
| **Multer + Sharp** | - | Загрузка и обработка изображений |
| **Helmet** | - | Security headers |
| **class-validator** | - | Валидация DTO |

### Blockchain

| Технология | Версия | Назначение |
|------------|--------|------------|
| **FunC** | - | Язык смарт-контрактов |
| **@ton/ton** | 16.x | TON SDK |
| **@ton/core** | 0.62.x | TON core библиотека |
| **@orbs-network/ton-access** | 2.3.x | TON API endpoint |
| **TonConnect** | - | Wallet аутентификация |

### DevOps (Planned)

- **Docker** + Docker Compose
- **MailHog** для тестирования email

### Frontend (TODO)

- **Next.js** 14.x (App Router)
- **Tailwind CSS** + shadcn/ui
- **Zustand** для state management
- **TonConnect UI React** для wallet
- **Socket.IO Client** для чатов

---

## Функциональность

### 🔐 Аутентификация

- **TON Wallet аутентификация** через TonConnect
- JWT токены для сессий
- Rate limiting (5 попыток / 15 минут)
- Генерация nonce для подписи

**Endpoints:**
```typescript
POST /api/auth/ton-connect     // Аутентификация
GET  /api/auth/nonce           // Получить nonce
```

### 👤 Пользователи

- Профили с TON wallet адресом
- Статистика (продажи, покупки, рейтинг)
- История транзакций
- Управление email и уведомлениями

**Endpoints:**
```typescript
GET   /api/users/:id           // Профиль
PATCH /api/users/:id           // Обновить профиль
GET   /api/users/:id/stats     // Статистика
```

### 📦 Объявления (Listings)

- CRUD операции с товарами
- **Full-text поиск** (PostgreSQL tsvector)
- Фильтрация (категория, цена, состояние, местоположение)
- Сортировка (дата, цена, популярность)
- Пагинация (20 товаров на страницу)
- До 10 фотографий на товар
- Счетчик просмотров
- Статусы: active, sold, reserved, removed, disputed

**Endpoints:**
```typescript
GET    /api/listings              // Поиск с фильтрами
GET    /api/listings/:id          // Детали товара
POST   /api/listings              // Создать (auth)
PATCH  /api/listings/:id          // Обновить (auth)
DELETE /api/listings/:id          // Удалить (auth)
GET    /api/listings/user/:userId // Товары пользователя
```

### 🏷️ Категории

- Иерархическая структура (родитель-потомок)
- Иконки для визуализации
- Активные/неактивные категории

**Endpoints:**
```typescript
GET /api/categories       // Список категорий
GET /api/categories/tree  // Дерево категорий
GET /api/categories/:id   // Детали
```

### 💳 Транзакции

- **Создание транзакции** → деплой эскроу контракта
- **Статусы:** pending → paid → completed / refunded / disputed
- **Эскроу система** для безопасности платежей
- Подтверждение получения покупателем
- Система разрешения споров
- История изменений транзакций

**Endpoints:**
```typescript
POST /api/transactions              // Создать транзакцию
GET  /api/transactions              // История
GET  /api/transactions/:id          // Детали
POST /api/transactions/:id/confirm  // Подтвердить получение
POST /api/transactions/:id/dispute  // Открыть спор
```

**Flow транзакции:**
```
1. Покупатель создает транзакцию → pending
2. Backend деплоит эскроу контракт
3. Покупатель оплачивает → paid
4. Продавец отправляет товар
5. Покупатель подтверждает → completed (средства продавцу)

ИЛИ спор → admin решает → completed/refunded
```

### 💬 Чат (WebSocket)

- Real-time обмен сообщениями
- Чаты привязаны к товарам
- Typing indicators
- Read receipts
- История сообщений

**WebSocket Events:**
```typescript
// Client → Server
chat:join          // Подключиться к чату
message:send       // Отправить сообщение
message:typing     // Печатаю...
message:read       // Прочитал

// Server → Client
message:new        // Новое сообщение
message:typing     // Кто-то печатает
notification:new   // Новое уведомление
transaction:update // Обновление транзакции
```

### ⭐ Отзывы

- Оценка 1-5 звезд
- Текстовый комментарий
- Один отзыв на транзакцию
- Автоматический расчет рейтинга
- Видны в профиле пользователя

**Endpoints:**
```typescript
POST /api/reviews                           // Оставить отзыв
GET  /api/reviews/user/:userId              // Отзывы пользователя
GET  /api/reviews/transaction/:txId         // Отзывы по сделке
```

### 📁 Файлы

- Загрузка изображений (JPEG, PNG, WebP)
- Максимум 5MB, до 10 файлов на товар
- Автоматическая оптимизация (Sharp)
- Генерация уникальных имен (UUID)
- Защита от path traversal

**Endpoints:**
```typescript
POST /api/files/upload  // Загрузить файл
```

### ⚖️ Админ панель

- Просмотр всех споров
- Разрешение споров (release/refund)
- Бан/разбан пользователей
- Удаление объявлений
- Логирование всех действий

**Endpoints (требуется admin роль):**
```typescript
GET  /api/admin/disputes              // Список споров
POST /api/admin/disputes/:id/resolve  // Разрешить спор
POST /api/admin/users/:id/ban         // Забанить
POST /api/admin/users/:id/unban       // Разбанить
```

### 🔔 Уведомления

- Email уведомления (через Bull queue)
- WebSocket уведомления
- Шаблоны на Handlebars
- Типы: новая транзакция, оплата, спор, сообщение, отзыв

---

## Структура проекта

```
diplom/
├── README.md                              ← Этот файл
├── CONTEXT.md                             ← Контекст для разработчика
├── SMART_CONTRACT_SUMMARY.md              ← Описание смарт-контракта
│
└── backend/                               ← NestJS Backend
    ├── package.json                       ← Зависимости
    ├── tsconfig.json                      ← TypeScript конфиг
    ├── nest-cli.json                      ← NestJS конфиг
    ├── .env                               ← Environment переменные
    ├── .env.example                       ← Пример конфигурации
    │
    ├── src/                               ← Исходный код
    │   ├── main.ts                        ← Точка входа
    │   ├── app.module.ts                  ← Корневой модуль
    │   │
    │   ├── config/                        ← Конфигурация
    │   │   ├── database.config.ts         ← PostgreSQL
    │   │   ├── redis.config.ts            ← Redis
    │   │   ├── ton.config.ts              ← TON blockchain
    │   │   ├── mail.config.ts             ← Email
    │   │   ├── security.config.ts         ← JWT, rate limiting
    │   │   └── app.config.ts              ← Общие настройки
    │   │
    │   ├── common/                        ← Общие компоненты
    │   │   ├── decorators/                ← @CurrentUser, @Public, @Roles
    │   │   ├── guards/                    ← JwtAuthGuard, AdminGuard
    │   │   ├── interfaces/                ← Общие интерфейсы
    │   │   └── entities/                  ← Вспомогательные entities
    │   │       ├── favorite.entity.ts
    │   │       ├── email-notification.entity.ts
    │   │       └── search-history.entity.ts
    │   │
    │   └── modules/                       ← Бизнес-модули (11 модулей)
    │       ├── auth/                      ← Аутентификация (TON wallet + JWT)
    │       │   ├── auth.controller.ts
    │       │   ├── auth.service.ts
    │       │   ├── auth.module.ts
    │       │   ├── strategies/
    │       │   │   └── jwt.strategy.ts
    │       │   └── dto/
    │       │
    │       ├── users/                     ← Пользователи
    │       │   ├── users.controller.ts
    │       │   ├── users.service.ts
    │       │   ├── users.module.ts
    │       │   ├── entities/
    │       │   │   └── user.entity.ts     ← 12 полей + relations
    │       │   └── dto/
    │       │
    │       ├── categories/                ← Категории товаров
    │       │   ├── categories.controller.ts
    │       │   ├── categories.service.ts
    │       │   ├── categories.module.ts
    │       │   ├── entities/
    │       │   │   └── category.entity.ts
    │       │   └── dto/
    │       │
    │       ├── listings/                  ← Объявления
    │       │   ├── listings.controller.ts
    │       │   ├── listings.service.ts    ← Search, filters, pagination
    │       │   ├── listings.module.ts
    │       │   ├── entities/
    │       │   │   ├── listing.entity.ts  ← Главная entity
    │       │   │   └── listing-image.entity.ts
    │       │   └── dto/
    │       │       ├── create-listing.dto.ts
    │       │       ├── update-listing.dto.ts
    │       │       └── search-listing.dto.ts
    │       │
    │       ├── transactions/              ← Транзакции + эскроу
    │       │   ├── transactions.controller.ts
    │       │   ├── transactions.service.ts
    │       │   ├── transactions.module.ts
    │       │   ├── entities/
    │       │   │   ├── transaction.entity.ts
    │       │   │   └── transaction-history.entity.ts
    │       │   └── dto/
    │       │
    │       ├── messages/                  ← WebSocket чат
    │       │   ├── messages.gateway.ts    ← Socket.IO gateway
    │       │   ├── messages.service.ts
    │       │   ├── messages.module.ts
    │       │   ├── entities/
    │       │   │   └── message.entity.ts
    │       │   └── dto/
    │       │
    │       ├── reviews/                   ← Отзывы и рейтинги
    │       │   ├── reviews.controller.ts
    │       │   ├── reviews.service.ts
    │       │   ├── reviews.module.ts
    │       │   ├── entities/
    │       │   │   └── review.entity.ts
    │       │   └── dto/
    │       │
    │       ├── files/                     ← Загрузка файлов
    │       │   ├── files.controller.ts
    │       │   ├── files.service.ts       ← Multer + Sharp
    │       │   └── files.module.ts
    │       │
    │       ├── blockchain/                ← TON интеграция
    │       │   ├── blockchain.module.ts
    │       │   └── services/
    │       │       ├── ton-client.service.ts
    │       │       └── escrow.service.ts  ← Работа с контрактами
    │       │
    │       ├── notifications/             ← Уведомления
    │       │   ├── notifications.service.ts
    │       │   └── notifications.module.ts
    │       │
    │       └── admin/                     ← Админ панель
    │           ├── admin.controller.ts
    │           ├── admin.service.ts       ← Разрешение споров
    │           ├── admin.module.ts
    │           ├── entities/
    │           │   └── admin-action.entity.ts
    │           └── dto/
    │
    ├── contracts/                         ← TON Смарт-контракты
    │   ├── escrow.fc                      ← Основной контракт (FunC)
    │   ├── imports/
    │   │   └── stdlib.fc                  ← Стандартная библиотека
    │   ├── wrappers/
    │   │   └── Escrow.ts                  ← TypeScript wrapper
    │   ├── scripts/
    │   │   ├── compileContract.ts         ← Компиляция контракта
    │   │   └── deployEscrow.ts            ← Пример деплоя
    │   ├── tests/
    │   │   └── Escrow.spec.ts             ← 12 unit тестов
    │   ├── build/                         ← Скомпилированные контракты
    │   ├── README.md                      ← Документация контракта
    │   └── IMPLEMENTATION_NOTES.md        ← Заметки разработчика
    │
    ├── uploads/                           ← Загруженные файлы
    │   └── .gitkeep
    │
    └── dist/                              ← Скомпилированный код (после build)
```

---

## Установка и запуск

### Требования

- Node.js 20+
- PostgreSQL 16
- Redis 7+ (опционально для dev)
- NPM/Yarn

### Установка

```bash
# 1. Клонировать репозиторий
git clone <repo-url>
cd diplom/backend

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env
# Отредактировать .env с вашими настройками

# 4. Подключиться к БД
# База данных уже существует: ton-service
# Проверьте настройки в .env:
# DATABASE_HOST=localhost
# DATABASE_PORT=5432
# DATABASE_NAME=ton-service
# DATABASE_USER=romashka
# DATABASE_PASSWORD=7851

# 5. (Опционально) Скомпилировать смарт-контракт
npm install @ton-community/func-js @ton/crypto
npm run contract:compile
```

### Запуск

```bash
# Development режим (с hot-reload)
npm run start:dev

# Production сборка
npm run build
npm run start:prod

# Тестирование
npm test
```

### Доступ

- **API:** http://localhost:3000/api
- **WebSocket:** ws://localhost:3000

### API Endpoints

Полный список endpoints доступен в [API Documentation](#api-documentation)

---

## Смарт-контракт

### Escrow Contract (FunC)

Полнофункциональный эскроу контракт для безопасных P2P сделок.

**Особенности:**
- 4 статуса: CREATED → FUNDED → RELEASED/REFUNDED
- 3 операции: fund, release, refund
- 8 GET методов для чтения состояния
- Автоматический возврат по таймауту (30 дней)
- Защита от несанкционированного доступа

**Структура:**
```
contracts/
├── escrow.fc              ← 250+ строк FunC кода
├── wrappers/Escrow.ts     ← TypeScript wrapper
├── tests/Escrow.spec.ts   ← 12 unit тестов
└── README.md              ← Полная документация
```

**Подробнее:** См. [SMART_CONTRACT_SUMMARY.md](./SMART_CONTRACT_SUMMARY.md)

**Использование:**

```typescript
// 1. Создать транзакцию (backend)
const escrowAddress = await escrowService.deployEscrow({
  sellerAddress: 'EQ...seller...',
  buyerAddress: 'EQ...buyer...',
  amount: 10, // TON
  timeoutSeconds: 30 * 24 * 60 * 60, // 30 days
});

// 2. Покупатель оплачивает (frontend через TonConnect)
// ton://transfer/{escrowAddress}?amount=10000000000

// 3. Покупатель подтверждает получение
await escrowService.release(escrowAddress);
```

---

## API Documentation

### Аутентификация

Все защищенные endpoints требуют JWT токен в заголовке:
```
Authorization: Bearer <jwt-token>
```

Получить токен:
```http
POST /api/auth/ton-connect
Content-Type: application/json

{
  "walletAddress": "EQ...",
  "signature": "...",
  "payload": "..."
}

Response: { "accessToken": "...", "user": {...} }
```

### Основные endpoints

#### Users
```http
GET    /api/users/:id              # Профиль пользователя
PATCH  /api/users/:id              # Обновить профиль (auth)
GET    /api/users/:id/stats        # Статистика
```

#### Listings
```http
GET    /api/listings                         # Поиск с фильтрами
       ?query=iphone                         # Full-text поиск
       &category_id=1                        # Фильтр по категории
       &minPrice=100&maxPrice=1000           # Диапазон цен
       &condition=new                        # Состояние (new/used/refurbished)
       &location=Moscow                      # Местоположение
       &sortBy=price&sortOrder=ASC           # Сортировка
       &page=1&limit=20                      # Пагинация

GET    /api/listings/:id                     # Детали товара
POST   /api/listings                         # Создать (auth)
PATCH  /api/listings/:id                     # Обновить (auth)
DELETE /api/listings/:id                     # Удалить (auth)
```

#### Transactions
```http
POST   /api/transactions                     # Создать транзакцию (auth)
       Body: { "listing_id": "uuid" }

GET    /api/transactions                     # История (auth)
GET    /api/transactions/:id                 # Детали (auth)
POST   /api/transactions/:id/confirm         # Подтвердить получение (auth)
POST   /api/transactions/:id/dispute         # Открыть спор (auth)
       Body: { "reason": "Товар не соответствует..." }
```

#### Admin
```http
GET    /api/admin/disputes                   # Список споров (admin)
POST   /api/admin/disputes/:id/resolve       # Разрешить спор (admin)
       Body: {
         "resolution": "refund_buyer" | "release_seller",
         "comment": "..."
       }

POST   /api/admin/users/:id/ban              # Забанить (admin)
       Body: { "reason": "..." }
```

### WebSocket События

**Подключение:**
```javascript
import io from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: { token: jwtToken }
});
```

**События:**
```javascript
// Присоединиться к чату
socket.emit('chat:join', {
  listingId: 'uuid',
  userId: 'uuid'
});

// Отправить сообщение
socket.emit('message:send', {
  listing_id: 'uuid',
  receiver_id: 'uuid',
  content: 'Hello!',
  senderId: 'uuid'
});

// Получить сообщение
socket.on('message:new', (message) => {
  console.log(message);
});
```

---

## База данных

### ER-диаграмма (основные таблицы)

```
users (1) ----< (M) listings [seller_id]
users (1) ----< (M) transactions [buyer_id, seller_id]
users (1) ----< (M) messages [sender_id, receiver_id]
users (1) ----< (M) reviews [reviewer_id, reviewee_id]

categories (1) ----< (M) listings [category_id]
categories (1) ----< (M) categories [parent_id] (self-reference)

listings (1) ----< (M) listing_images
listings (1) ----< (M) transactions
listings (1) ----< (M) messages

transactions (1) ----< (M) reviews
transactions (1) ----< (M) transaction_history
```

### Основные таблицы

**users** - Пользователи
- `wallet_address` (UNIQUE) - TON адрес
- `username`, `display_name`, `email`
- `rating`, `total_sales`, `total_purchases`
- `is_active`, `is_admin`

**listings** - Объявления товаров
- `seller_id` → users.id
- `category_id` → categories.id
- `title`, `description`, `price`
- `status` (active/sold/reserved/removed/disputed)
- `condition` (new/used/refurbished)
- `views_count`, `search_vector` (для full-text)

**transactions** - Транзакции
- `listing_id`, `buyer_id`, `seller_id`
- `amount`, `escrow_contract_address`
- `status` (pending/paid/completed/refunded/disputed)
- `dispute_reason`, `dispute_resolved_by`

**messages** - Сообщения чата
- `listing_id`, `sender_id`, `receiver_id`
- `content`, `is_read`

**reviews** - Отзывы
- `transaction_id`, `reviewer_id`, `reviewee_id`
- `rating` (1-5), `comment`

### Индексы

- Full-text search на `listings.title + description` (PostgreSQL tsvector)
- Composite индексы на часто используемые фильтры
- Индексы для JOIN операций

---

## Безопасность

### Реализованные меры

✅ **JWT Authentication**
- Токены с expiration (7 дней)
- Проверка на каждом protected endpoint
- Refresh token механизм (TODO)

✅ **Rate Limiting**
- Глобальный лимит: 100 запросов/минуту
- Auth endpoints: 5 попыток/15 минут
- Upload: 10 файлов/минуту

✅ **XSS Protection**
- sanitize-html для очистки input
- Content Security Policy через Helmet
- HTML entity encoding

✅ **CSRF Protection**
- CSRF токены (опционально, отключено в dev)
- SameSite cookies

✅ **Input Validation**
- class-validator для всех DTO
- whitelist: true (удаление неописанных полей)
- Типизация на уровне TypeScript

✅ **File Upload Security**
- Проверка MIME типа
- Ограничение размера (5MB)
- Ограничение количества (10 файлов)
- Защита от path traversal
- Генерация уникальных имен (UUID)

✅ **Database Security**
- Prepared statements (TypeORM)
- SQL injection protection
- Encrypted passwords (TODO для admin панели)

### TODO для Production

- [ ] Двухфакторная аутентификация
- [ ] HTTPS only в production
- [ ] Secrets в environment variables
- [ ] Database backup стратегия
- [ ] Audit logging
- [ ] DDoS protection
- [ ] Penetration testing

---

## Разработка

### Структура модуля (пример)

```typescript
modules/listings/
├── listings.module.ts           ← Module definition
├── listings.controller.ts       ← REST endpoints
├── listings.service.ts          ← Business logic
├── entities/
│   ├── listing.entity.ts        ← TypeORM entity
│   └── listing-image.entity.ts
└── dto/
    ├── create-listing.dto.ts    ← Validation DTO
    ├── update-listing.dto.ts
    └── search-listing.dto.ts
```

### Создание нового модуля

```bash
# Сгенерировать модуль
nest g module modules/new-feature
nest g controller modules/new-feature
nest g service modules/new-feature
```

### TypeORM Миграции

```bash
# Создать миграцию
npm run migration:generate -- -n MigrationName

# Запустить миграции
npm run migration:run

# Откатить последнюю миграцию
npm run migration:revert
```

### Тестирование

```bash
# Unit тесты
npm test

# Конкретный файл
npm test src/modules/users/users.service.spec.ts

# Смарт-контракт
npm test contracts/tests/Escrow.spec.ts

# Coverage
npm test -- --coverage
```

### Код стайл

```bash
# Форматирование
npm run format

# Линтинг
npm run lint
```

### Debug

```bash
# Debug режим
npm run start:debug

# Подключиться debugger в VS Code/WebStorm
# Port: 9229
```

---

## TODO

### Backend

- [ ] Настроить Redis для кеширования
- [ ] Реализовать Bull queues для email
- [ ] Настроить Nodemailer + email templates
- [ ] Реализовать seed скрипты для категорий
- [ ] Создать админ пользователя через seed
- [ ] Добавить pagination helpers
- [ ] Реализовать favorites функциональность
- [ ] Добавить search history tracking

### Blockchain

- [ ] Установить @ton-community/func-js
- [ ] Скомпилировать escrow контракт
- [ ] Настроить admin wallet
- [ ] Реализовать реальный деплой контрактов
- [ ] Реализовать отправку release/refund транзакций
- [ ] Создать transaction monitor сервис
- [ ] Реализовать keeper для автоматических refund
- [ ] Протестировать на TON testnet

### Frontend

- [ ] Создать Next.js проект
- [ ] Настроить TonConnect UI
- [ ] Реализовать страницы (home, listings, profile, etc.)
- [ ] Интегрировать Socket.IO для чатов
- [ ] Создать компоненты UI (shadcn/ui)
- [ ] Реализовать state management (Zustand)
- [ ] Добавить адаптивный дизайн

### DevOps

- [ ] Создать Dockerfile для backend
- [ ] Создать docker-compose.yml
- [ ] Настроить MailHog для dev
- [ ] Настроить CI/CD pipeline
- [ ] Создать production deployment guide

### Безопасность

- [ ] Провести security audit
- [ ] Настроить Helmet правильно для production
- [ ] Реализовать refresh tokens
- [ ] Добавить 2FA (опционально)
- [ ] Настроить HTTPS в production
- [ ] Реализовать rate limiting per user

### Тестирование

- [ ] Написать E2E тесты
- [ ] Добавить integration тесты
- [ ] Увеличить покрытие unit тестами
- [ ] Тестирование на testnet
- [ ] Load testing

---

## Авторы

- **Backend Developer:** AI Assistant
- **Smart Contract Developer:** AI Assistant
- **Project Owner:** roma.serebrennikov.00@mail.ru

## Лицензия

MIT

---

## Полезные ссылки

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [TON Documentation](https://docs.ton.org/)
- [FunC Documentation](https://docs.ton.org/develop/func/overview)
- [TonConnect Documentation](https://docs.ton.org/develop/dapps/ton-connect/)
- [Socket.IO Documentation](https://socket.io/docs/)

---

**Проект создан как MVP для демонстрации концепции децентрализованной торговой платформы на TON блокчейне.**
