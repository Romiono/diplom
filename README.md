# Дипломный проект - TON Marketplace

Децентрализованная торговая платформа (P2P) на базе блокчейна TON. 

Пользователи могут размещать объявления и совершать сделки с оплатой в TON-криптовалюте. Все платежи проходят через эскроу смарт-контракт — средства заморожены до тех пор, пока покупатель не подтвердит получение товара. При возникновении спора администратор принимает решение и вручную высвобождает или возвращает средства.

Вход в систему осуществляется через TON-кошелёк (TonConnect) — без паролей и регистрации.

---

## Быстрый старт

### Требования

- Docker и Docker Compose
- TON API ключ — получить у [@toncenterv2bot](https://t.me/toncenterv2bot) в Telegram
- TON кошелёк с балансом на testnet — пополнить через [@testgiver_ton_bot](https://t.me/testgiver_ton_bot)

### 1. Настроить окружение

Открыть `.env` и заполнить обязательные поля:

```env
TON_API_KEY=           # ключ от @toncenterv2bot
TON_ADMIN_WALLET_MNEMONIC=   # 24 слова мнемоники кошелька-администратора
JWT_SECRET=            # произвольная строка, желательно длинная
```

### 2. Запустить стек

```bash
docker compose up -d
```

### 3. Получить публичный URL (для TonConnect)

TonConnect требует HTTPS. Cloudflare Tunnel создаётся автоматически:

```bash
docker compose logs cloudflared | grep trycloudflare
```

Скопировать URL вида `https://xxxx.trycloudflare.com`, вставить в `.env`:

```env
TUNNEL_URL=https://xxxx.trycloudflare.com
```

Перезапустить frontend:

```bash
docker compose up -d --force-recreate frontend
```

### 4. Готово

| Сервис | Адрес |
|--------|-------|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000/api |
| Публичный доступ | https://xxxx.trycloudflare.com |

> Tunnel URL меняется при каждом перезапуске `cloudflared`. После перезапуска стека повторите шаг 3.

---

## О проекте

### Функциональность

**Аутентификация**
- Вход через TON-кошелёк (TonConnect)
- Подпись Ed25519 верифицируется на сервере
- JWT-сессии

**Объявления**
- Создание, редактирование, удаление
- Full-text поиск (PostgreSQL tsvector)
- Фильтрация по категории, цене, состоянию, местоположению
- Загрузка до 10 фотографий
- Счётчик просмотров

**Сделки и эскроу**
- Создание сделки → автоматический деплой смарт-контракта на TON testnet
- Покупатель оплачивает через TonConnect
- Покупатель подтверждает получение → средства уходят продавцу
- Покупатель открывает спор → администратор принимает решение
- Автоматический возврат по таймауту (30 дней)

**Чат**
- Real-time переписка покупателя и продавца (Socket.IO)
- Чаты привязаны к объявлениям
- Typing indicators

**Отзывы**
- Оценка 1–5 после завершения сделки
- Автоматический пересчёт рейтинга продавца

**Уведомления**
- WebSocket-уведомления в реальном времени

**Административная панель (только бекенд)**
- Просмотр и разрешение споров
- Бан / разбан пользователей

**Интерфейс**
- Русский и английский язык (переключение в шапке)
- Адаптивный дизайн

---

## Технологический стек

**Backend** — NestJS (TypeScript), PostgreSQL, Redis, Socket.IO, TypeORM, Bull, Multer + Sharp

**Frontend** — Next.js (App Router), Tailwind CSS, shadcn/ui, Zustand, next-intl, TonConnect UI React

**Blockchain** — FunC (смарт-контракт), @ton/ton SDK, TonConnect

**Инфраструктура** — Docker Compose, Cloudflare Tunnel

---

## Смарт-контракт

Эскроу-контракт написан на FunC и развёртывается при создании каждой сделки.

Контракт поддерживает 4 статуса: `CREATED → FUNDED → RELEASED / REFUNDED`

Операции:
- `OP 1` — пополнение покупателем
- `OP 2` — высвобождение средств продавцу (покупатель или admin)
- `OP 3` — возврат средств покупателю (admin или по таймауту)

Исходник: `backend/contracts/escrow.fc`
TypeScript wrapper: `backend/contracts/wrappers/Escrow.ts`
Тесты (12 кейсов): `backend/contracts/tests/Escrow.spec.ts`

---

## API

Базовый URL: `http://localhost:3000/api`

Защищённые эндпоинты требуют заголовок:
```
Authorization: Bearer <jwt-token>
```

Основные группы:
- `POST /api/auth/ton-connect` — аутентификация
- `GET  /api/auth/nonce` — получить nonce для подписи
- `GET/POST/PATCH/DELETE /api/listings` — объявления
- `GET/POST /api/transactions` — сделки
- `GET /api/messages/chats` — список чатов
- `GET /api/messages/history/:listingId` — история переписки
- `POST /api/reviews` — оставить отзыв
- `GET /api/notifications` — уведомления
- `POST /api/admin/disputes/:id/resolve` — разрешить спор (admin)
- `GET /api/blockchain/health` — статус подключения к TON

WebSocket подключение:
```javascript
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { auth: { token: jwtToken } });
```
