# TON Marketplace Backend

Backend приложения торговой платформы на базе TON блокчейна.

## Технологический стек

- **Framework**: NestJS 10.x (TypeScript)
- **API**: REST + WebSocket (Socket.IO)
- **Database**: PostgreSQL 16
- **ORM**: TypeORM 0.3.x
- **Authentication**: Passport.js + JWT
- **TON Integration**: @ton/ton, @ton/core
- **Cache**: Redis (опционально)

## Установка

```bash
# Установка зависимостей
npm install

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

## Конфигурация базы данных

Приложение использует существующую базу данных PostgreSQL:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ton-service
DATABASE_USER=romashka
DATABASE_PASSWORD=7851
```

## Запуск приложения

```bash
# Development режим
npm run start:dev

# Production сборка
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/ton-connect` - Аутентификация через TON wallet
- `GET /api/auth/nonce` - Получить nonce для подписи

### Users
- `GET /api/users/:id` - Получить профиль пользователя
- `PATCH /api/users/:id` - Обновить профиль
- `GET /api/users/:id/stats` - Статистика пользователя

### Listings
- `GET /api/listings` - Поиск и фильтрация товаров
- `GET /api/listings/:id` - Детали товара
- `POST /api/listings` - Создать объявление (auth)
- `PATCH /api/listings/:id` - Обновить объявление (auth)
- `DELETE /api/listings/:id` - Удалить объявление (auth)

### Categories
- `GET /api/categories` - Список категорий
- `GET /api/categories/tree` - Дерево категорий
- `GET /api/categories/:id` - Детали категории

### Transactions
- `POST /api/transactions` - Создать транзакцию (покупка)
- `GET /api/transactions` - История транзакций пользователя
- `GET /api/transactions/:id` - Детали транзакции
- `POST /api/transactions/:id/confirm` - Подтвердить получение товара
- `POST /api/transactions/:id/dispute` - Открыть спор

### Reviews
- `POST /api/reviews` - Оставить отзыв
- `GET /api/reviews/user/:userId` - Отзывы пользователя
- `GET /api/reviews/transaction/:transactionId` - Отзывы по транзакции

### Files
- `POST /api/files/upload` - Загрузить изображение

### Admin (требуется admin права)
- `GET /api/admin/disputes` - Список споров
- `POST /api/admin/disputes/:id/resolve` - Разрешить спор
- `POST /api/admin/users/:id/ban` - Забанить пользователя

## WebSocket Events

### Подключение
```javascript
const socket = io('ws://localhost:3000');
```

### События
- `chat:join` - Подключиться к чату товара
- `message:send` - Отправить сообщение
- `message:new` - Получить новое сообщение
- `message:typing` - Индикатор печати

## Структура проекта

```
backend/
├── src/
│   ├── config/           # Конфигурационные файлы
│   ├── common/           # Общие компоненты (guards, decorators, pipes)
│   ├── modules/          # Бизнес-модули
│   │   ├── auth/
│   │   ├── users/
│   │   ├── listings/
│   │   ├── categories/
│   │   ├── transactions/
│   │   ├── messages/
│   │   ├── reviews/
│   │   ├── files/
│   │   ├── blockchain/
│   │   ├── notifications/
│   │   └── admin/
│   ├── app.module.ts
│   └── main.ts
├── uploads/             # Загруженные файлы
└── dist/               # Скомпилированные файлы
```

## Безопасность

- JWT аутентификация для защищенных endpoints
- Rate limiting (100 запросов/минуту)
- Helmet для security headers
- Input validation с class-validator
- XSS защита с sanitize-html

## Разработка

```bash
# Запуск в development режиме с hot-reload
npm run start:dev

# Линтинг
npm run lint

# Форматирование кода
npm run format

# Сборка
npm run build
```

## TON Blockchain Integration

### Текущий статус (MVP)
- Упрощенная верификация подписей TON wallet
- Mock деплой эскроу контрактов
- Базовая структура для blockchain операций

### TODO для production
- Полная реализация верификации TON подписей
- Реальный деплой FunC эскроу контрактов
- Мониторинг blockchain транзакций
- Обработка gas fees
- Keeper сервис для автоматических операций

## Примечания

- Это MVP версия, некоторые функции упрощены для демонстрации
- TON blockchain интеграция требует доработки для production
- Email уведомления не настроены (требуется SMTP)
- Файлы хранятся локально (для production рекомендуется S3/CDN)

## Лицензия

ISC
