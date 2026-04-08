# Frontend Development Plan — TON Marketplace (FSD Architecture)
> Детальный план для агента-разработчика. Следуй строго по фазам.
> Backend API: `http://localhost:3000/api` | Frontend: `http://localhost:3001`
> Архитектура: **Feature-Sliced Design (FSD)**

---

## СТАТУС РЕАЛИЗАЦИИ

| Фаза | Статус | Примечание |
|------|--------|------------|
| 0. Backend изменения | ✅ ГОТОВО | + доп. изменения auth при реализации |
| 1. Project Setup | ✅ ГОТОВО | |
| 2. shared layer | ✅ ГОТОВО | Выполнено в рамках фазы 1 |
| 3. entities layer | ✅ ГОТОВО | Все 8 срезов |
| 4. features layer | ✅ ГОТОВО | Все 13 фич |
| 5. widgets + app infra | ⏳ СЛЕДУЮЩИЙ | |
| 6–12. Страницы + polish | 🔲 НЕ НАЧАТО | |

---

## 0. Обязательные изменения на бэкенде ✅

### 0.1 `image_urls` в CreateListingDto / UpdateListingDto ✅
**Файл:** `backend/src/modules/listings/dto/create-listing.dto.ts`
```typescript
@IsOptional()
@IsArray()
@IsString({ each: true })       // ⚠️ НЕ @IsUrl — он отклоняет localhost URLs
@MaxLength(500, { each: true })
@ArrayMaxSize(10)
image_urls?: string[];
```
**Файл:** `backend/src/modules/listings/listings.service.ts` — в `create()` сохраняет `ListingImage` записи после сохранения листинга, `update()` удаляет старые и вставляет новые, возвращает `findListing(id)` (с images).

### 0.2 Статические файлы под `/api/uploads/` ✅
**Файл:** `backend/src/app.module.ts` — `serveRoot: '/api/uploads'`
**Файл:** `backend/src/modules/files/files.service.ts` — возвращает `/api/uploads/${year}/${month}/${filename}`

### 0.3 Публичный `GET /listings/user/:userId` ✅
`@Public()` на `getUserListings`, принимает `user: JwtPayload | undefined`, передаёт `user?.sub ?? null` в сервис.

### 0.4 TonConnect ton_proof аутентификация ✅ (добавлено при реализации)
**Проблема:** backend верифицировал подпись по схеме `ton-auth:{addr}:{nonce}`, но `@tonconnect/ui-react` создаёт стандартный `ton_proof` с другим форматом.

**Решение:** добавлен второй путь верификации в `auth.service.ts`:

**Файл:** `backend/src/modules/auth/dto/ton-auth.dto.ts`
```typescript
// Добавлены опциональные поля для ton_proof flow:
@IsOptional() @IsNumber() timestamp?: number;
@IsOptional() @IsString() domain?: string;
@IsOptional() @IsNumber() domainLen?: number;
```

**Файл:** `backend/src/modules/auth/auth.service.ts`
```typescript
// Если переданы timestamp+domain+domainLen → standard ton_proof verification:
// sha256( 0xffff || "ton-connect" || sha256("ton-proof-item-v2/" || wc || hash || dl || domain || ts || payload) )
// Timestamp freshness window: ±5 минут
// Иначе → legacy nonce: signVerify("ton-auth:{addr}:{nonce}", sig, pubkey)
```

---

## 1. FSD — принципы и правила импортов

```
Слои (сверху вниз):
  app  →  pages  →  widgets  →  features  →  entities  →  shared

Правила:
  ✅ Верхний слой импортирует из нижнего
  ❌ Нижний слой НЕ импортирует из верхнего
  ❌ Срезы одного слоя НЕ импортируют друг друга (СТРОГО)
  ✅ Каждый срез экспортирует только через index.ts (публичное API)
```

**Структура каждого среза:**
```
{layer}/{slice}/
  ├── ui/          # React-компоненты
  ├── model/       # состояние, хуки, типы, схемы
  ├── api/         # запросы к серверу
  ├── lib/         # вспомогательные функции среза
  └── index.ts     # публичное API среза
```

**⚠️ Важно о cross-slice:**
Когда entities/message/ui/ChatCard.tsx нужна картинка листинга — нельзя импортировать `getPrimaryImage` из `@entities/listing`. Логика дублируется inline, используя только `@shared/lib/utils`.

---

## 2. Полная структура проекта (фактическая)

```
frontend/
├── src/
│   ├── app/
│   │   ├── globals.css                  # Tailwind 4 + shadcn CSS vars (oklch)
│   │   ├── page.tsx                     # redirect('/ru')
│   │   ├── providers/
│   │   │   └── index.tsx                # QueryClient + TonConnectUIProvider
│   │   └── [locale]/
│   │       ├── layout.tsx               # NextIntlClientProvider + ThemeProvider + Providers + Toaster
│   │       ├── page.tsx                 # → <HomePage />
│   │       ├── listings/
│   │       │   ├── page.tsx             # → <ListingsCatalogPage />
│   │       │   ├── create/page.tsx      # → <ListingCreatePage /> [protected]
│   │       │   └── [id]/
│   │       │       ├── page.tsx         # → <ListingDetailPage />
│   │       │       └── edit/page.tsx    # → <ListingEditPage /> [protected]
│   │       ├── users/[id]/page.tsx      # → <UserProfilePage />
│   │       └── (protected)/
│   │           ├── layout.tsx           # <AuthGuard>{children}</AuthGuard>
│   │           ├── transactions/
│   │           │   ├── page.tsx         # → <TransactionsListPage />
│   │           │   └── [id]/page.tsx    # → <TransactionDetailPage />
│   │           ├── messages/
│   │           │   ├── page.tsx         # → <MessagesListPage />
│   │           │   └── [listingId]/page.tsx # → <ChatPage />
│   │           ├── profile/
│   │           │   ├── page.tsx         # → <MyProfilePage />
│   │           │   └── listings/page.tsx # → <MyListingsPage />
│   │           └── notifications/page.tsx  # → <NotificationsPage />
│   │
│   ├── pages/                           # СЛОЙ: pages
│   │   ├── home/ui/HomePage.tsx
│   │   ├── listings-catalog/ui/ListingsCatalogPage.tsx
│   │   ├── listing-detail/ui/ListingDetailPage.tsx
│   │   ├── listing-create/ui/ListingCreatePage.tsx
│   │   ├── listing-edit/ui/ListingEditPage.tsx
│   │   ├── user-profile/ui/UserProfilePage.tsx
│   │   ├── my-profile/ui/MyProfilePage.tsx
│   │   ├── my-listings/ui/MyListingsPage.tsx
│   │   ├── transactions-list/ui/TransactionsListPage.tsx
│   │   ├── transaction-detail/ui/TransactionDetailPage.tsx
│   │   ├── messages-list/ui/MessagesListPage.tsx
│   │   ├── chat/ui/ChatPage.tsx
│   │   └── notifications/ui/NotificationsPage.tsx
│   │
│   ├── widgets/                         # СЛОЙ: widgets
│   │   ├── navbar/ui/Navbar.tsx
│   │   ├── footer/ui/Footer.tsx
│   │   ├── listings-feed/ui/ListingsFeed.tsx
│   │   ├── listing-detail-view/ui/ListingDetailView.tsx
│   │   ├── transaction-detail-view/ui/TransactionDetailView.tsx
│   │   ├── chat-room/
│   │   │   ├── model/useChat.ts         # WebSocket hook
│   │   │   ├── ui/ChatRoom.tsx
│   │   │   └── ui/TypingIndicator.tsx
│   │   ├── chat-list/ui/ChatList.tsx
│   │   ├── user-profile-view/ui/UserProfileView.tsx
│   │   ├── my-profile-view/ui/MyProfileView.tsx
│   │   ├── my-listings-view/ui/MyListingsView.tsx
│   │   └── notifications-list/ui/NotificationsList.tsx
│   │
│   ├── features/                        # СЛОЙ: features ✅ ВСЕ ГОТОВО
│   │   ├── auth-by-ton/
│   │   │   ├── model/useAuthByTon.ts    # ← фактическое имя (не useAuth)
│   │   │   ├── ui/ConnectButton.tsx     # ← фактическое имя (не AuthButton)
│   │   │   └── index.ts
│   │   ├── listing-create/
│   │   │   ├── model/useCreateListing.ts
│   │   │   ├── ui/CreateListingForm.tsx # ← фактическое имя (не ListingForm)
│   │   │   └── index.ts
│   │   ├── listing-edit/
│   │   │   ├── model/useEditListing.ts
│   │   │   ├── ui/EditListingForm.tsx   # ← фактическое имя
│   │   │   └── index.ts
│   │   ├── listing-delete/
│   │   │   ├── model/useDeleteListing.ts
│   │   │   ├── ui/DeleteListingButton.tsx
│   │   │   └── index.ts
│   │   ├── listing-buy/
│   │   │   ├── model/useBuyListing.ts
│   │   │   ├── ui/BuyButton.tsx
│   │   │   └── index.ts
│   │   ├── transaction-pay/
│   │   │   ├── model/usePayTransaction.ts
│   │   │   ├── ui/PayButton.tsx
│   │   │   └── index.ts
│   │   ├── transaction-confirm/
│   │   │   ├── model/useConfirmTransaction.ts  # ← фактическое имя
│   │   │   ├── ui/ConfirmButton.tsx            # ← фактическое имя
│   │   │   └── index.ts
│   │   ├── transaction-dispute/
│   │   │   ├── model/useOpenDispute.ts
│   │   │   ├── ui/DisputeDialog.tsx     # ← фактическое имя (не DisputeForm)
│   │   │   └── index.ts
│   │   ├── review-create/
│   │   │   ├── model/useCreateReview.ts
│   │   │   ├── ui/CreateReviewForm.tsx  # ← фактическое имя (не ReviewForm)
│   │   │   └── index.ts
│   │   ├── profile-edit/
│   │   │   ├── model/useEditProfile.ts
│   │   │   ├── ui/EditProfileForm.tsx   # ← фактическое имя
│   │   │   └── index.ts
│   │   ├── listings-filter/
│   │   │   ├── ui/ListingsFilter.tsx    # ← фактическое имя; useListingFilters НЕ создавался отдельно
│   │   │   └── index.ts
│   │   ├── toggle-theme/
│   │   │   ├── ui/ThemeToggle.tsx
│   │   │   └── index.ts
│   │   └── switch-locale/
│   │       ├── ui/LocaleSwitcher.tsx
│   │       └── index.ts
│   │
│   ├── entities/                        # СЛОЙ: entities ✅ ВСЕ ГОТОВО
│   │   ├── user/
│   │   │   ├── api/usersApi.ts
│   │   │   ├── model/auth.store.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/UserAvatar.tsx
│   │   │   ├── ui/UserCard.tsx
│   │   │   └── index.ts
│   │   ├── listing/
│   │   │   ├── api/listingsApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── lib/listing.utils.ts
│   │   │   ├── ui/ListingCard.tsx
│   │   │   ├── ui/ListingGrid.tsx
│   │   │   ├── ui/ListingImageGallery.tsx
│   │   │   └── index.ts
│   │   ├── transaction/
│   │   │   ├── api/transactionsApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/TransactionCard.tsx
│   │   │   ├── ui/TransactionStepper.tsx
│   │   │   └── index.ts
│   │   ├── message/
│   │   │   ├── api/messagesApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/MessageBubble.tsx
│   │   │   ├── ui/ChatCard.tsx
│   │   │   └── index.ts
│   │   ├── review/
│   │   │   ├── api/reviewsApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/ReviewCard.tsx
│   │   │   ├── ui/StarRating.tsx
│   │   │   └── index.ts
│   │   ├── category/
│   │   │   ├── api/categoriesApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/CategoryBadge.tsx
│   │   │   └── index.ts
│   │   ├── notification/
│   │   │   ├── api/notificationsApi.ts
│   │   │   ├── model/queries.ts
│   │   │   ├── ui/NotificationItem.tsx
│   │   │   └── index.ts
│   │   └── blockchain/
│   │       ├── api/blockchainApi.ts
│   │       ├── model/queries.ts
│   │       ├── ui/EscrowInfo.tsx
│   │       ├── ui/TonBalance.tsx
│   │       └── index.ts
│   │
│   ├── shared/                          # СЛОЙ: shared ✅ ГОТОВО
│   │   ├── api/client.ts
│   │   ├── config/env.ts
│   │   ├── lib/utils.ts
│   │   ├── types/api.ts
│   │   └── ui/
│   │       ├── StatusBadge.tsx
│   │       ├── PaginationControls.tsx
│   │       ├── EmptyState.tsx
│   │       └── AuthGuard.tsx
│   │
│   ├── lib/utils.ts                     # ← re-export cn для shadcn compat
│   └── i18n/
│       ├── routing.ts
│       ├── request.ts
│       └── messages/{ru,en}.json
│
├── src/components/ui/                   # ← shadcn компоненты ЗДЕСЬ (не в shared/ui)
│   ├── alert-dialog.tsx, avatar.tsx, badge.tsx, button.tsx, card.tsx
│   ├── dialog.tsx, dropdown-menu.tsx, form.tsx, input.tsx, label.tsx
│   ├── navigation-menu.tsx, select.tsx, separator.tsx, sheet.tsx
│   ├── skeleton.tsx, tabs.tsx, textarea.tsx, tooltip.tsx
│   └── ...
│
├── middleware.ts
├── public/
│   ├── tonconnect-manifest.json         # ⚠️ нужно создать!
│   └── icon.png
├── next.config.ts
└── .env.local
```

---

## 3. Path Aliases (tsconfig.json) ✅

```json
"paths": {
  "@app/*":      ["./src/app/*"],
  "@pages/*":    ["./src/pages/*"],
  "@widgets/*":  ["./src/widgets/*"],
  "@features/*": ["./src/features/*"],
  "@entities/*": ["./src/entities/*"],
  "@shared/*":   ["./src/shared/*"]
}
```

**shadcn использует `@/` alias** (стандартный Next.js), а не `@shared/`:
```typescript
// ПРАВИЛЬНО для shadcn компонентов:
import { Button } from '@/components/ui/button';
// ПРАВИЛЬНО для shared компонентов:
import { StatusBadge } from '@shared/ui/StatusBadge';
```

---

## 4. Переменные окружения (.env.local) ✅

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_TON_NETWORK=testnet
```

---

## 5. СЛОЙ: shared ✅

### Tailwind 4 — НЕТ tailwind.config.ts!
Конфигурация темы — через CSS `@theme inline {}` в `globals.css`.
```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:is(.dark *));
@theme inline {
  --color-background: var(--background);
  /* ... */
}
```

### shared/api/client.ts — ключевые особенности
```typescript
// 1. getToken() читает из localStorage НАПРЯМУЮ (не через Zustand) — избегает circular deps
// 2. FormData: если body instanceof FormData — Content-Type НЕ устанавливается
// 3. При 401 — чистит localStorage ('ton-marketplace-auth')
// 4. При 204 — возвращает undefined as T
const getToken = () => {
  const raw = localStorage.getItem('ton-marketplace-auth');
  return JSON.parse(raw)?.state?.token ?? null;
};
```

### shared/lib/utils.ts — функции
```typescript
cn()              // clsx + tailwind-merge
formatTON()       // number → "1.23 TON"
formatNanoTON()   // nano string → "1.23 TON"
formatDate()      // ISO → "15 апреля 2025"
formatRelative()  // ISO → "5 минут назад"
truncateAddress() // "EQD...abc" → "EQD...abc"
toAbsoluteUrl()   // "/api/uploads/x.jpg" → "http://localhost:3000/api/uploads/x.jpg"
                  // удаляет "/api" из NEXT_PUBLIC_API_URL и прибавляет URL
```

---

## 6. СЛОЙ: entities ✅

### Реальные имена query keys (важно для invalidateQueries):

```typescript
// userKeys:
userKeys.all          // ['users']
userKeys.detail(id)   // ['users', id]   ← НЕ byId
userKeys.current()    // ['users', 'me'] ← НЕ me (это функция!)

// listingKeys:
listingKeys.all
listingKeys.search(params)
listingKeys.detail(id)   // ← НЕ byId
listingKeys.user(userId, page)

// txKeys:
txKeys.all
txKeys.list(page)
txKeys.detail(id)   // ← НЕ byId

// reviewKeys:
reviewKeys.byUser(userId)
reviewKeys.byTransaction(txId)

// messageKeys:
messageKeys.chats()
messageKeys.history(listingId)

// categoryKeys:
categoryKeys.all
categoryKeys.byId(id)

// blockchainKeys:
blockchainKeys.health
blockchainKeys.balance(address)
blockchainKeys.escrow(address)

// notificationKeys:
notificationKeys.my(page, limit)
```

### entities/user/api/usersApi.ts
```typescript
tonConnect: (data: {
  walletAddress: string;
  publicKey: string;
  signature: string;
  payload: string;
  timestamp?: number;   // для ton_proof flow
  domain?: string;
  domainLen?: number;
}) => apiFetch<AuthResponse>('/auth/ton-connect', ...)
```

### entities/category/api/categoriesApi.ts
⚠️ Бэкенд НЕ имеет `/categories/tree` эндпоинта. Только:
- `GET /categories` → `Category[]` (с `children?: Category[]`)
- `GET /categories/:id` → `Category`

---

## 7. СЛОЙ: features ✅

### auth-by-ton — фактическая реализация

**Хук `useAuthByTon`** (не `useAuth`):
```typescript
// ПОТОК:
// 1. connect() → генерирует UUID → setConnectRequestParameters({ tonProof: uuid }) → openModal()
// 2. При подключении кошелёк подписывает ton_proof
// 3. useEffect смотрит на wallet.connectItems?.tonProof
// 4. Если proof есть — вызывает usersApi.tonConnect с proof данными
// 5. При успехе → setAuth(accessToken, user)
// 6. При ошибке → tonConnectUI.disconnect()

const { connect, disconnect, address, isAuthenticated, isPending } = useAuthByTon();
```

**`ConnectButton`** (не `AuthButton`) — показывает:
- Кнопку "Подключить кошелёк" если не подключён
- Spinner "Подписание..." если isPending
- DropdownMenu с аватаром/именем/logout если авторизован

### listing-create / listing-edit — загрузка изображений
```typescript
// 1. Файлы хранятся в state как File[]
// 2. При submit: uploadImages(files) → POST /files/upload (FormData, поле 'file')
// 3. Response: { url: "/api/uploads/year/month/filename.ext", size, mimeType }
// 4. Собираем image_urls из existingUrls + newUrls → передаём в listingsApi
```

### transaction-pay — реальный TON sendTransaction
```typescript
// toNano = (amount: number) => String(Math.floor(amount * 1e9))
// tonConnectUI.sendTransaction({ validUntil: +600s, messages: [{ address: escrow, amount: nano }] })
// result.boc → transactionsApi.updatePayment(txId, boc)
// Ошибки: если message === 'Reject request' → пользователь отклонил, не показываем ошибку
```

### listings-filter — без отдельного model хука
`useListingFilters` не создавался. Вся логика (чтение searchParams, push к router) — внутри `ListingsFilter.tsx`. При использовании в виджетах — достаточно рендерить `<ListingsFilter />`.

---

## 8. СЛОЙ: widgets

### widgets/chat-room/model/useChat.ts

```typescript
'use client';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '@entities/user';
import { useMessageHistory } from '@entities/message';
import { env } from '@shared/config/env';
import type { Message } from '@shared/types/api';

export function useChat(listingId: string) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const { data: historyData } = useMessageHistory(listingId);

  useEffect(() => {
    if (!token) return;
    const socket = io(env.wsUrl, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { listingId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', (msg: Message) =>
      setRealtimeMessages((p) => [...p, msg])
    );
    socket.on('message:typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    });

    return () => { socket.disconnect(); };
  }, [token, listingId]);

  const sendMessage = (receiverId: string, content: string) =>
    socketRef.current?.emit('message:send', {
      listing_id: listingId, receiver_id: receiverId, content,
    });

  const sendTyping = () =>
    socketRef.current?.emit('message:typing', { listingId });

  // Дедупликация: история + realtime
  const historyMessages = historyData?.data ?? [];
  const realtimeIds = new Set(realtimeMessages.map((m) => m.id));
  const allMessages = [
    ...historyMessages.filter((m) => !realtimeIds.has(m.id)),
    ...realtimeMessages,
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return { messages: allMessages, isTyping, connected, sendMessage, sendTyping };
}
```

### widgets/navbar/ui/Navbar.tsx

```tsx
'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@entities/user/model/auth.store';
import { ConnectButton } from '@features/auth-by-ton';   // ← ConnectButton, не AuthButton
import { ThemeToggle } from '@features/toggle-theme';
import { LocaleSwitcher } from '@features/switch-locale';
import { Bell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const { isAuthenticated } = useAuthStore();

  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={`/${locale}`} className="font-bold text-lg">TON Market</Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href={`/${locale}`}>{t('home')}</Link>
          <Link href={`/${locale}/listings`}>{t('listings')}</Link>
          {isAuthenticated && (
            <>
              <Link href={`/${locale}/messages`}>{t('messages')}</Link>
              <Link href={`/${locale}/transactions`}>{t('transactions')}</Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LocaleSwitcher />
          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/${locale}/notifications`}><Bell className="size-4" /></Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/${locale}/listings/create`}>
                  <Plus className="size-4 mr-1" />{t('create') /* добавить в i18n */}
                </Link>
              </Button>
            </>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
```

### widgets/footer/ui/Footer.tsx

```tsx
import Link from 'next/link';
import { useLocale } from 'next-intl';

export function Footer() {
  const locale = useLocale();
  return (
    <footer className="border-t mt-auto py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        © 2025 TON Marketplace ·{' '}
        <Link href={`/${locale}/listings`} className="hover:underline">Объявления</Link>
      </div>
    </footer>
  );
}
```

### widgets/listings-feed/ui/ListingsFeed.tsx

```tsx
'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ListingGrid } from '@entities/listing/ui/ListingGrid';
import { PaginationControls } from '@shared/ui/PaginationControls';
import { ListingsFilter } from '@features/listings-filter';
import { useListings } from '@entities/listing/model/queries';
import type { ListingSearchParams } from '@shared/types/api';

export function ListingsFeed() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);

  const params: ListingSearchParams = {
    query: searchParams?.get('query') ?? undefined,
    category_id: searchParams?.get('category_id') ? Number(searchParams.get('category_id')) : undefined,
    minPrice: searchParams?.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams?.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    condition: searchParams?.get('condition') as ListingSearchParams['condition'] ?? undefined,
    sortBy: searchParams?.get('sortBy') as ListingSearchParams['sortBy'] ?? undefined,
    sortOrder: searchParams?.get('sortOrder') as 'ASC' | 'DESC' ?? undefined,
    page,
    limit: 20,
  };

  const { data, isLoading } = useListings(params);

  return (
    <div className="flex gap-6">
      {/* Desktop sidebar filter */}
      <aside className="hidden lg:block w-64 shrink-0">
        <ListingsFilter />
      </aside>

      <div className="flex-1 min-w-0">
        {/* Mobile filter sheet */}
        <div className="lg:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4 mr-2" />Фильтры
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader><SheetTitle>Фильтры</SheetTitle></SheetHeader>
              <div className="mt-4">
                <ListingsFilter />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <ListingGrid
          listings={data?.data ?? []}
          isLoading={isLoading}
        />

        {data && data.totalPages > 1 && (
          <PaginationControls
            page={page}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
```

### widgets/listing-detail-view/ui/ListingDetailView.tsx

```tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListing } from '@entities/listing/model/queries';
import { ListingImageGallery } from '@entities/listing/ui/ListingImageGallery';
import { CategoryBadge } from '@entities/category/ui/CategoryBadge';
import { UserCard } from '@entities/user/ui/UserCard';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { ReviewCard } from '@entities/review/ui/ReviewCard';
import { useUserReviews } from '@entities/review/model/queries';
import { BuyButton } from '@features/listing-buy';
import { DeleteListingButton } from '@features/listing-delete';
import { useAuthStore } from '@entities/user/model/auth.store';
import { formatTON, formatDate } from '@shared/lib/utils';

interface Props { listingId: string; }

export function ListingDetailView({ listingId }: Props) {
  const t = useTranslations('listing');
  const locale = useLocale();
  const { data: listing, isLoading } = useListing(listingId);
  const { data: reviews } = useUserReviews(listing?.seller.id ?? '');
  const { user } = useAuthStore();

  if (isLoading) return <div className="animate-pulse space-y-4">...</div>;
  if (!listing) return null;

  const isOwner = user?.id === listing.seller_id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <ListingImageGallery listing={listing} />

      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold">{listing.title}</h1>
            <StatusBadge status={listing.status} ns="listing" />
          </div>
          <p className="text-3xl font-bold text-primary">{formatTON(listing.price)}</p>
          <p className="text-sm text-muted-foreground mt-1">{formatDate(listing.created_at)}</p>
        </div>

        {listing.category && <CategoryBadge category={listing.category} asLink />}

        <p className="text-muted-foreground whitespace-pre-wrap">{listing.description}</p>

        {listing.location && (
          <p className="text-sm">📍 {listing.location}</p>
        )}

        <div className="flex flex-wrap gap-3">
          {listing.status === 'active' && !isOwner && (
            <BuyButton
              listingId={listing.id}
              price={listing.price}
              sellerId={listing.seller_id}
            />
          )}
          {isOwner && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/${locale}/listings/${listing.id}/edit`}>
                  <Edit className="size-4 mr-2" />{t('edit')}
                </Link>
              </Button>
              <DeleteListingButton listingId={listing.id} />
            </>
          )}
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm font-medium mb-3">Продавец</p>
          <UserCard user={listing.seller} />
        </div>

        {reviews && reviews.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Отзывы о продавце</h3>
            {reviews.slice(0, 3).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

### widgets/transaction-detail-view/ui/TransactionDetailView.tsx

```tsx
'use client';
import { useTransaction } from '@entities/transaction/model/queries';
import { TransactionStepper } from '@entities/transaction/ui/TransactionStepper';
import { EscrowInfo } from '@entities/blockchain/ui/EscrowInfo';
import { StatusBadge } from '@shared/ui/StatusBadge';
import { PayButton } from '@features/transaction-pay';
import { ConfirmButton } from '@features/transaction-confirm';
import { DisputeDialog } from '@features/transaction-dispute';
import { CreateReviewForm } from '@features/review-create';
import { useTransactionReviews } from '@entities/review/model/queries';
import { useAuthStore } from '@entities/user/model/auth.store';
import { formatTON, formatDate } from '@shared/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface Props { transactionId: string; }

export function TransactionDetailView({ transactionId }: Props) {
  const locale = useLocale();
  const { data: tx, isLoading } = useTransaction(transactionId);
  const { data: reviews } = useTransactionReviews(transactionId);
  const { user } = useAuthStore();

  if (isLoading) return <div className="animate-pulse">Загрузка...</div>;
  if (!tx || !user) return null;

  const hasReview = reviews?.some((r) => r.reviewer_id === user.id);
  const counterparty = user.id === tx.buyer_id ? tx.seller : tx.buyer;
  const isBuyer = user.id === tx.buyer_id;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Сделка</h1>
        <StatusBadge status={tx.status} ns="transaction" />
      </div>

      <TransactionStepper status={tx.status} />

      {/* Listing summary */}
      <div className="border rounded-lg p-4">
        <Link href={`/${locale}/listings/${tx.listing_id}`}
          className="font-medium hover:underline">
          {tx.listing.title}
        </Link>
        <p className="text-2xl font-bold mt-1">{formatTON(tx.amount)}</p>
        <p className="text-sm text-muted-foreground">
          {isBuyer ? 'Продавец' : 'Покупатель'}: {counterparty.display_name ?? counterparty.username}
        </p>
      </div>

      {/* Escrow contract */}
      {tx.escrow_contract_address && (
        <EscrowInfo contractAddress={tx.escrow_contract_address} />
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {isBuyer && <PayButton transaction={tx} />}
        {isBuyer && <ConfirmButton transaction={tx} buyerId={user.id} />}
        <DisputeDialog transaction={tx} currentUserId={user.id} />
      </div>

      {/* Review form after completion */}
      {tx.status === 'completed' && !hasReview && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-4">Оставить отзыв</h3>
          <CreateReviewForm
            transactionId={tx.id}
            revieweeId={isBuyer ? tx.seller_id : tx.buyer_id}
          />
        </div>
      )}

      {/* Dispute info */}
      {tx.dispute_reason && (
        <div className="border border-destructive rounded-lg p-4 text-sm">
          <p className="font-medium text-destructive">Причина спора:</p>
          <p className="text-muted-foreground mt-1">{tx.dispute_reason}</p>
          {tx.dispute_opened_at && (
            <p className="text-xs mt-2">Открыт: {formatDate(tx.dispute_opened_at)}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

### widgets/user-profile-view/ui/UserProfileView.tsx

```tsx
'use client';
import { useUser } from '@entities/user/model/queries';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { useUserListings } from '@entities/listing/model/queries';
import { useUserReviews } from '@entities/review/model/queries';
import { ListingGrid } from '@entities/listing/ui/ListingGrid';
import { ReviewCard } from '@entities/review/ui/ReviewCard';
import { StarRating } from '@entities/review/ui/StarRating';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { truncateAddress } from '@shared/lib/utils';

interface Props { userId: string; }

export function UserProfileView({ userId }: Props) {
  const { data: user } = useUser(userId);
  const { data: listings } = useUserListings(userId);
  const { data: reviews } = useUserReviews(userId);

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <UserAvatar user={user} size="lg" />
        <div>
          <h1 className="text-xl font-bold">
            {user.display_name ?? user.username ?? truncateAddress(user.wallet_address)}
          </h1>
          <p className="text-sm text-muted-foreground">{truncateAddress(user.wallet_address)}</p>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={Math.round(user.rating)} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              {user.rating.toFixed(1)} · {user.total_sales} продаж
            </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="listings">
        <TabsList>
          <TabsTrigger value="listings">Объявления ({listings?.total ?? 0})</TabsTrigger>
          <TabsTrigger value="reviews">Отзывы ({reviews?.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="listings" className="mt-4">
          <ListingGrid listings={listings?.data ?? []} isLoading={!listings} />
        </TabsContent>
        <TabsContent value="reviews" className="mt-4">
          {reviews?.map((r) => <ReviewCard key={r.id} review={r} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### widgets/my-profile-view/ui/MyProfileView.tsx

```tsx
'use client';
import { useState } from 'react';
import { useCurrentUser } from '@entities/user/model/queries';
import { UserAvatar } from '@entities/user/ui/UserAvatar';
import { StarRating } from '@entities/review/ui/StarRating';
import { EditProfileForm } from '@features/profile-edit';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { truncateAddress } from '@shared/lib/utils';

export function MyProfileView() {
  const { data: user } = useCurrentUser();
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar user={user} size="lg" />
          <div>
            <h1 className="text-xl font-bold">
              {user.display_name ?? user.username ?? truncateAddress(user.wallet_address)}
            </h1>
            <p className="text-sm text-muted-foreground">{truncateAddress(user.wallet_address)}</p>
            <StarRating value={Math.round(user.rating)} readonly size="sm" />
          </div>
        </div>
        <Button variant="outline" onClick={() => setEditOpen(true)}>Редактировать</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{user.rating.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Рейтинг</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{user.total_sales}</p>
          <p className="text-sm text-muted-foreground">Продаж</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-2xl font-bold">{user.total_purchases}</p>
          <p className="text-sm text-muted-foreground">Покупок</p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать профиль</DialogTitle></DialogHeader>
          <EditProfileForm user={user} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### widgets/my-listings-view/ui/MyListingsView.tsx

```tsx
'use client';
import { useState } from 'react';
import { useAuthStore } from '@entities/user/model/auth.store';
import { useUserListings } from '@entities/listing/model/queries';
import { ListingGrid } from '@entities/listing/ui/ListingGrid';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ListingStatus } from '@shared/types/api';

const STATUS_TABS: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'sold', label: 'Проданные' },
  { value: 'reserved', label: 'Зарезервированные' },
];

export function MyListingsView() {
  const { user } = useAuthStore();
  const [page] = useState(1);
  const { data } = useUserListings(user?.id ?? '', page);

  const listings = data?.data ?? [];

  return (
    <Tabs defaultValue="all">
      <TabsList>
        {STATUS_TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
        ))}
      </TabsList>
      {STATUS_TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="mt-4">
          <ListingGrid
            listings={t.value === 'all' ? listings : listings.filter((l) => l.status === t.value)}
            isLoading={!data}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
```

### widgets/chat-room/ui/ChatRoom.tsx

```tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageBubble } from '@entities/message/ui/MessageBubble';
import { useAuthStore } from '@entities/user/model/auth.store';
import { useChat } from '../model/useChat';

interface Props {
  listingId: string;
  receiverId: string;
}

export function ChatRoom({ listingId, receiverId }: Props) {
  const { user } = useAuthStore();
  const { messages, isTyping, connected, sendMessage, sendTyping } = useChat(listingId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(receiverId, text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.sender_id === user?.id} />
        ))}
        {isTyping && (
          <div className="text-xs text-muted-foreground animate-pulse px-2">Печатает...</div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t p-3 flex gap-2">
        <Input
          value={text}
          onChange={(e) => { setText(e.target.value); sendTyping(); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Написать сообщение..."
          disabled={!connected}
        />
        <Button onClick={handleSend} disabled={!connected || !text.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
```

### widgets/notifications-list/ui/NotificationsList.tsx

```tsx
'use client';
import { useState } from 'react';
import { useMyNotifications } from '@entities/notification/model/queries';
import { NotificationItem } from '@entities/notification/ui/NotificationItem';
import { PaginationControls } from '@shared/ui/PaginationControls';
import { EmptyState } from '@shared/ui/EmptyState';
import { Bell } from 'lucide-react';

export function NotificationsList() {
  const [page, setPage] = useState(1);
  const { data } = useMyNotifications(page);

  if (!data?.data.length) {
    return <EmptyState icon={Bell} title="Уведомлений нет" />;
  }

  return (
    <div>
      {data.data.map((n) => <NotificationItem key={n.id} notification={n} />)}
      <PaginationControls page={page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}
```

### widgets/chat-list/ui/ChatList.tsx

```tsx
'use client';
import { useChats } from '@entities/message/model/queries';
import { ChatCard } from '@entities/message/ui/ChatCard';
import { EmptyState } from '@shared/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export function ChatList() {
  const { data: chats } = useChats();

  if (!chats?.length) {
    return <EmptyState icon={MessageSquare} title="Чатов нет" />;
  }

  return (
    <div className="space-y-1">
      {chats.map((chat) => <ChatCard key={chat.listing.id} chat={chat} />)}
    </div>
  );
}
```

---

## 9. СЛОЙ: app (Next.js routes)

### app/[locale]/layout.tsx ✅
```tsx
// params: Promise<{ locale: string }> — Next.js 16, await params
const { locale } = await params;
const messages = await getMessages();
// Порядок провайдеров: NextIntlClientProvider → ThemeProvider → Providers → Navbar → main → Footer → Toaster
```

### app/[locale]/(protected)/layout.tsx ✅
```tsx
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>;
}
```

### Route файлы — паттерн

```tsx
// Статические (без params):
export default function Page() { return <ListingsCatalogPage />; }

// Динамические (Next.js 16 — params Promise):
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetailPage id={id} />;
}
```

**⚠️ НЕ делать так (устарело):**
```tsx
// НЕПРАВИЛЬНО в Next.js 16:
export default function Page({ params }: { params: { id: string } }) { ... }
```

### public/tonconnect-manifest.json ⚠️ НЕ СОЗДАН
```json
{
  "url": "http://localhost:3001",
  "name": "TON Marketplace",
  "iconUrl": "http://localhost:3001/icon.png"
}
```

---

## 10. СЛОЙ: pages (page-level композиция)

Страницы — тонкий слой: только `container` + заголовок + один виджет.

```tsx
// pages/listings-catalog/ui/ListingsCatalogPage.tsx
'use client';
import { Suspense } from 'react';
import { ListingsFeed } from '@widgets/listings-feed';

export function ListingsCatalogPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Объявления</h1>
      <Suspense>  {/* нужен для useSearchParams внутри ListingsFeed */}
        <ListingsFeed />
      </Suspense>
    </div>
  );
}

// pages/listing-detail/ui/ListingDetailPage.tsx
import { ListingDetailView } from '@widgets/listing-detail-view';
export function ListingDetailPage({ id }: { id: string }) {
  return <div className="container mx-auto px-4 py-8"><ListingDetailView listingId={id} /></div>;
}

// pages/transaction-detail/ui/TransactionDetailPage.tsx
import { TransactionDetailView } from '@widgets/transaction-detail-view';
export function TransactionDetailPage({ id }: { id: string }) {
  return <div className="container mx-auto px-4 py-8"><TransactionDetailView transactionId={id} /></div>;
}

// pages/home/ui/HomePage.tsx
import { ListingsFeed } from '@widgets/listings-feed';
export function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">TON Marketplace</h1>
        <p className="text-muted-foreground">Безопасная торговля с эскроу на блокчейне TON</p>
      </section>
      <Suspense><ListingsFeed /></Suspense>
    </div>
  );
}
```

---

## 11. i18n ✅

**Правило**: в server components → `getTranslations()` (async), в client → `useTranslations()`.

**Навигация**: не использовать `createNavigation`, вместо этого строить URL вручную с `const locale = useLocale()` → `` `/${locale}/path` ``.

---

## 12. Конфигурационные файлы ✅

### next.config.ts
```typescript
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '3000', pathname: '/api/uploads/**' },
    ],
  },
};
export default withNextIntl(nextConfig);
```

### src/lib/utils.ts ← нужен для shadcn compat
```typescript
export { cn } from '@shared/lib/utils';
```

---

## 13. Ключевые правила для агента

1. **shadcn компоненты**: `import { Button } from '@/components/ui/button'` — НЕ `@shared/ui/button`

2. **FSD импорты через index.ts**: `import { ListingCard } from '@entities/listing'` — НЕ из `@entities/listing/ui/ListingCard` напрямую

3. **Кросс-срезные импорты ЗАПРЕЩЕНЫ**: entities НЕ импортирует из других entities. Данные — через props.

4. **URL изображений**: backend отдаёт `/api/uploads/...`. Для `<Image>` → `toAbsoluteUrl(url)`. В `next.config.ts` настроен remotePatterns для localhost:3000.

5. **apiFetch**: НЕ использует useAuthStore (circular dep). Читает token из localStorage. FormData автоматически пропускает Content-Type.

6. **useSearchParams / usePathname** могут возвращать `null` в Next.js 16 — всегда guard: `searchParams?.get('key')`, `pathname ?? ''`

7. **params в Next.js 16** — это `Promise`, нужен `await params` в server components.

8. **Zustand auth store key**: `'ton-marketplace-auth'` — токен по пути `state.token`

9. **useListingFilters** — отдельного хука нет. Фильтрация инлайн в `ListingsFilter.tsx` через `useSearchParams` + `router.push`.

10. **Locale в ссылках**: `const locale = useLocale()` → `` `/${locale}/listings` ``

11. **Tailwind 4**: нет `tailwind.config.ts`. Кастомизация только через `@theme inline {}` в `globals.css`.

12. **Suspense для useSearchParams**: компоненты с `useSearchParams()` должны быть обёрнуты в `<Suspense>` на уровне страницы.

13. **ConnectButton** (auth-by-ton) — полнофункциональный компонент с dropdown при авторизации. Navbar использует `<ConnectButton />`, не `<AuthButton />`.

14. **tonconnect-manifest.json** → `public/tonconnect-manifest.json` — **ещё не создан**.

15. **Формы**: используем `useState` локально (не react-hook-form) — так фактически реализовано в create/edit формах. RHF остаётся опцией для более сложных форм.

---

## 14. Порядок разработки (оставшиеся фазы)

### Фаза 5 — widgets layer + app infrastructure ← СЛЕДУЮЩИЙ

**Шаг 1: Создать public/tonconnect-manifest.json**

**Шаг 2: Создать все widget index.ts файлы**

**Шаг 3: widgets по порядку**
```
widgets/navbar/          Navbar (использует ConnectButton, ThemeToggle, LocaleSwitcher)
widgets/footer/          Footer
widgets/listings-feed/   ListingsFeed (с Suspense wrapper)
widgets/listing-detail-view/   ListingDetailView
widgets/transaction-detail-view/  TransactionDetailView
widgets/chat-room/       useChat + ChatRoom + TypingIndicator
widgets/chat-list/       ChatList
widgets/user-profile-view/  UserProfileView
widgets/my-profile-view/    MyProfileView
widgets/my-listings-view/   MyListingsView
widgets/notifications-list/ NotificationsList
```

**Шаг 4: app routes**
```
app/[locale]/page.tsx           → <HomePage />
app/[locale]/listings/page.tsx  → <ListingsCatalogPage />  (Suspense!)
```

**Шаг 5: Проверить запуск** `npm run dev`

---

### Фаза 6 — Страницы листингов

```
pages/home/              HomePage
pages/listings-catalog/  ListingsCatalogPage (Suspense для useSearchParams)
pages/listing-detail/    ListingDetailPage
pages/listing-create/    ListingCreatePage
pages/listing-edit/      ListingEditPage

app routes:
  [locale]/page.tsx
  [locale]/listings/page.tsx
  [locale]/listings/[id]/page.tsx     ← await params
  [locale]/listings/create/page.tsx
  [locale]/listings/[id]/edit/page.tsx ← await params
  [locale]/users/[id]/page.tsx         ← await params
```

---

### Фаза 7 — Профиль и пользователи

```
pages/user-profile/   UserProfilePage
pages/my-profile/     MyProfilePage
pages/my-listings/    MyListingsPage

app routes:
  [locale]/users/[id]/page.tsx
  [locale]/(protected)/profile/page.tsx
  [locale]/(protected)/profile/listings/page.tsx
```

---

### Фаза 8 — Транзакции

```
pages/transactions-list/   TransactionsListPage
pages/transaction-detail/  TransactionDetailPage

app routes:
  [locale]/(protected)/transactions/page.tsx
  [locale]/(protected)/transactions/[id]/page.tsx  ← await params
```

TransactionsListPage показывает две вкладки (Покупки / Продажи), фильтруя `useTransactions()` по `buyer_id` / `seller_id`.

---

### Фаза 9 — Чат

```
pages/messages-list/  MessagesListPage
pages/chat/           ChatPage

app routes:
  [locale]/(protected)/messages/page.tsx
  [locale]/(protected)/messages/[listingId]/page.tsx  ← await params
```

ChatPage: получает listingId из params → `<ChatRoom listingId={id} receiverId={...} />`. Нужно определить receiverId: загрузить историю и взять собеседника.

---

### Фаза 10 — Уведомления

```
pages/notifications/   NotificationsPage
app/[locale]/(protected)/notifications/page.tsx
```

---

### Фаза 11 — Polish

```
- SEO: generateMetadata в listings/[id] и users/[id]
- Skeleton: ListingGrid уже поддерживает isLoading → показывает Skeleton
- EmptyState: уже реализован в shared/ui
- error.tsx в каждой route группе
- not-found.tsx
- Мобильное меню в Navbar (Sheet или bottom nav)
- Проверить все useTranslations покрытия
- Проверить dark/light переключение
- Убедиться что все protected routes редиректят на главную с ?redirect=
```

---

## 15. Известные проблемы и решения

| Проблема | Решение |
|----------|---------|
| `@IsUrl` отклоняет localhost URLs | Заменить на `@IsString({ each: true })` + `@MaxLength` |
| `useSearchParams()` возвращает null | Guard: `searchParams?.get('key') ?? null` |
| `usePathname()` возвращает null | Guard: `pathname ?? ''` |
| Cross-slice entity данные | Данные через props, утилиты дублировать inline |
| apiFetch circular dep с Zustand | Читать token из localStorage напрямую |
| Next.js 16 params — Promise | `const { id } = await params` в server components |
| shadcn + Tailwind 4 | Нет tailwind.config.ts, shadcn импорты — `@/components/ui/...` |
| `useSearchParams` + Suspense | Обёртка `<Suspense>` на уровне страницы обязательна |
| Navbar locale prefix | Строить URL вручную: `` `/${locale}/path` `` |
| tonconnect-manifest.json | Создать вручную в `public/` |
