# Frontend Plan — TON Marketplace

## Stack

| Слой | Технология | Обоснование |
|------|-----------|-------------|
| Framework | **Next.js 15 (App Router)** | SSR/SSG для листингов, server components, file-based routing |
| UI | **shadcn/ui + Tailwind CSS** | Кастомизируемые компоненты, встроен в Next.js экосистему |
| Server state | **TanStack Query v5** | Кэш, инвалидация, оптимистичные обновления, pagination |
| Client state | **Zustand** | Только auth (JWT + user) — всё остальное в TQ |
| Forms | **React Hook Form + Zod** | shadcn Form построен на RHF; Zod для валидации и типов |
| TON | **@tonconnect/ui-react + @ton/ton** | Подключение кошелька, чтение баланса |
| WebSocket | **socket.io-client** | Real-time чат (gateway на бэке — Socket.IO) |
| Даты | **dayjs** | Лёгкий форматтер |
| Изображения | **next/image** | Оптимизация, lazy-load |

---

## Структура проекта

```
frontend/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (Providers, Navbar, Footer)
│   │   ├── page.tsx                  # / — Главная (поиск + featured listings)
│   │   ├── listings/
│   │   │   ├── page.tsx              # /listings — Каталог с фильтрами
│   │   │   ├── create/
│   │   │   │   └── page.tsx          # /listings/create — Создание [protected]
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # /listings/[id] — Детали листинга
│   │   │       └── edit/
│   │   │           └── page.tsx      # /listings/[id]/edit [protected, seller only]
│   │   ├── users/
│   │   │   └── [id]/
│   │   │       └── page.tsx          # /users/[id] — Публичный профиль
│   │   ├── transactions/
│   │   │   ├── page.tsx              # /transactions — Мои сделки [protected]
│   │   │   └── [id]/
│   │   │       └── page.tsx          # /transactions/[id] — Детали сделки [protected]
│   │   ├── messages/
│   │   │   ├── page.tsx              # /messages — Список чатов [protected]
│   │   │   └── [listingId]/
│   │   │       └── page.tsx          # /messages/[listingId] — Чат [protected]
│   │   ├── profile/
│   │   │   ├── page.tsx              # /profile — Мой профиль [protected]
│   │   │   └── listings/
│   │   │       └── page.tsx          # /profile/listings — Мои листинги [protected]
│   │   └── notifications/
│   │       └── page.tsx              # /notifications — История email [protected]
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui (auto-generated)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── AuthGuard.tsx         # Redirect if not authenticated
│   │   ├── auth/
│   │   │   ├── TonConnectButton.tsx  # Кнопка подключения кошелька
│   │   │   └── AuthFlow.tsx          # nonce → sign → JWT flow
│   │   ├── listings/
│   │   │   ├── ListingCard.tsx       # Карточка в каталоге
│   │   │   ├── ListingGrid.tsx       # Сетка карточек + skeleton
│   │   │   ├── ListingFilters.tsx    # Сайдбар/Sheet с фильтрами
│   │   │   ├── ListingForm.tsx       # Форма создания/редактирования
│   │   │   ├── ListingImageUpload.tsx# Загрузка изображений (POST /files/upload)
│   │   │   ├── ListingDetail.tsx     # Полный вид листинга
│   │   │   └── BuyButton.tsx         # Кнопка покупки → POST /transactions
│   │   ├── transactions/
│   │   │   ├── TransactionCard.tsx
│   │   │   ├── TransactionStepper.tsx# Визуальный прогресс: pending→paid→completed
│   │   │   ├── TransactionActions.tsx# Confirm receipt / Open dispute
│   │   │   ├── DisputeForm.tsx
│   │   │   └── EscrowInfo.tsx        # Адрес контракта, баланс TON
│   │   ├── messages/
│   │   │   ├── ChatList.tsx          # GET /messages/chats
│   │   │   ├── ChatRoom.tsx          # WebSocket + history
│   │   │   ├── MessageBubble.tsx
│   │   │   └── TypingIndicator.tsx
│   │   ├── reviews/
│   │   │   ├── ReviewForm.tsx        # POST /reviews
│   │   │   ├── ReviewList.tsx        # GET /reviews/user/:id
│   │   │   └── StarRating.tsx        # Display + input (1–5)
│   │   ├── notifications/
│   │   │   ├── NotificationList.tsx
│   │   │   └── NotificationItem.tsx  # status badge: pending/sent/failed
│   │   └── shared/
│   │       ├── UserAvatar.tsx
│   │       ├── StatusBadge.tsx       # listing/transaction status
│   │       ├── PaginationControls.tsx
│   │       ├── EmptyState.tsx
│   │       └── TonBalance.tsx        # GET /blockchain/balance/:address
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts             # fetch wrapper с auth header
│   │   │   ├── auth.ts               # POST /auth/ton-connect, GET /auth/nonce
│   │   │   ├── listings.ts           # CRUD + search
│   │   │   ├── transactions.ts       # CRUD + actions
│   │   │   ├── messages.ts           # REST history + chats
│   │   │   ├── reviews.ts
│   │   │   ├── users.ts
│   │   │   ├── notifications.ts
│   │   │   ├── categories.ts
│   │   │   ├── files.ts              # POST /files/upload
│   │   │   └── blockchain.ts         # balance, escrow state
│   │   ├── hooks/                    # TanStack Query hooks
│   │   │   ├── useListings.ts
│   │   │   ├── useTransactions.ts
│   │   │   ├── useMessages.ts
│   │   │   ├── useReviews.ts
│   │   │   ├── useUsers.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useCategories.ts
│   │   │   └── useChat.ts            # WebSocket hook
│   │   ├── stores/
│   │   │   └── auth.store.ts         # Zustand: token + user, persist
│   │   ├── validators/
│   │   │   ├── listing.schema.ts     # Zod schemas
│   │   │   ├── transaction.schema.ts
│   │   │   ├── review.schema.ts
│   │   │   └── user.schema.ts
│   │   └── utils.ts                  # formatTON, formatDate, cn()
│   │
│   └── types/
│       └── api.ts                    # Все TypeScript типы (User, Listing, …)
│
├── public/
│   └── tonconnect-manifest.json      # TON Connect app manifest
├── next.config.ts
├── tailwind.config.ts
└── .env.local                        # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
```

---

## Типы (types/api.ts)

```typescript
export interface User {
  id: string;
  wallet_address: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  rating: number;
  total_sales: number;
  total_purchases: number;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed' | 'disputed';
export type ListingCondition = 'new' | 'used' | 'refurbished';

export interface Listing {
  id: string;
  seller_id: string;
  category_id: number | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  status: ListingStatus;
  condition: ListingCondition | null;
  location: string | null;
  views_count: number;
  created_at: string;
  seller: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url' | 'rating'>;
  category: Category | null;
}

export type TransactionStatus =
  | 'pending' | 'paid' | 'completed' | 'disputed' | 'refunded';

export interface Transaction {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  escrow_contract_address: string | null;
  tx_hash: string | null;
  status: TransactionStatus;
  created_at: string;
  paid_at: string | null;
  completed_at: string | null;
  dispute_reason: string | null;
  dispute_opened_at: string | null;
  listing: Listing;
  buyer: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url'>;
  seller: Pick<User, 'id' | 'wallet_address' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface Message {
  id: string;
  listing_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  transaction_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer: Pick<User, 'id' | 'username' | 'display_name' | 'avatar_url'>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  icon: string | null;
  is_active: boolean;
  children?: Category[];
}

export interface EmailNotification {
  id: string;
  subject: string;
  template: string;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  sent_at: string | null;
  created_at: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

---

## Auth Store (Zustand)

```typescript
// lib/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  isAdmin: boolean;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),
      logout: () => set({ token: null, user: null, isAuthenticated: false }),
    }),
    { name: 'ton-marketplace-auth' }
  )
);
```

---

## API Client

```typescript
// lib/api/client.ts
import { useAuthStore } from '@/lib/stores/auth.store';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(public status: number, public body: { message: string | string[]; error?: string }) {
    super(Array.isArray(body.message) ? body.message.join(', ') : body.message);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const isFormData = init.body instanceof FormData;

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    if (res.status === 401) useAuthStore.getState().logout();
    throw new ApiError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
```

---

## TanStack Query Hooks (примеры)

```typescript
// lib/hooks/useListings.ts
export const listingsKeys = {
  all: ['listings'] as const,
  search: (params: SearchParams) => [...listingsKeys.all, params] as const,
  detail: (id: string) => [...listingsKeys.all, id] as const,
  user: (userId: string) => [...listingsKeys.all, 'user', userId] as const,
};

export function useListings(params: SearchParams) {
  return useQuery({
    queryKey: listingsKeys.search(params),
    queryFn: () => api.listings.search(params),
    staleTime: 30_000,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: listingsKeys.detail(id),
    queryFn: () => api.listings.getById(id),
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.listings.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: listingsKeys.all }),
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.listings.remove(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: listingsKeys.all });
      qc.removeQueries({ queryKey: listingsKeys.detail(id) });
    },
  });
}
```

```typescript
// lib/hooks/useTransactions.ts
export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (txId: string) => api.transactions.confirm(txId),
    onSuccess: (_, txId) => {
      qc.invalidateQueries({ queryKey: ['transactions', txId] });
      qc.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

---

## WebSocket Hook

```typescript
// lib/hooks/useChat.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth.store';
import type { Message } from '@/types/api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3000';

export function useChat(listingId: string) {
  const token = useAuthStore((s) => s.token);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('chat:join', { listingId });
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('message:new', (msg: Message) =>
      setMessages((prev) => [...prev, msg])
    );
    socket.on('message:typing', () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 2000);
    });

    return () => { socket.disconnect(); };
  }, [token, listingId]);

  const sendMessage = (receiverId: string, content: string) => {
    socketRef.current?.emit('message:send', { listing_id: listingId, receiver_id: receiverId, content });
  };

  const sendTyping = () => {
    socketRef.current?.emit('message:typing', { listingId });
  };

  return { messages, setMessages, isTyping, connected, sendMessage, sendTyping };
}
```

---

## TON Connect Auth Flow

```typescript
// components/auth/AuthFlow.tsx
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import * as api from '@/lib/api/auth';

export function AuthFlow() {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleAuth = async () => {
    if (!wallet) {
      await tonConnectUI.openModal();
      return;
    }
    const address = wallet.account.address;
    // 1. Получить nonce
    const { nonce } = await api.getNonce(address);
    // 2. Подписать через TonConnect
    const result = await tonConnectUI.sendTransaction({
      // TON Connect personal_sign через ton_proof
      // Используем ton_proof при подключении кошелька
    });
    // 3. Обменять подпись на JWT
    const { accessToken, user } = await api.tonConnect({
      walletAddress: address,
      publicKey: wallet.account.publicKey,
      signature: result.signature,
      payload: nonce,
    });
    setAuth(accessToken, user);
  };

  return <Button onClick={handleAuth}>{wallet ? 'Sign In' : 'Connect Wallet'}</Button>;
}
```

> **Примечание:** При подключении через `@tonconnect/ui-react` запрашивать `ton_proof` в `TonConnectUIProvider` (`walletsListConfiguration.tonProof`). Готовый proof содержит подпись и payload — их передавать в `/auth/ton-connect`.

---

## Страницы и компоненты (детально)

### `/` — Главная

**Компоненты:**
- Hero с поисковой строкой → redirect на `/listings?query=...`
- `FeaturedListings` — последние 8 активных листингов (`GET /listings?limit=8&sortBy=created_at`)
- `CategoryGrid` — иконки категорий (`GET /categories/tree`)
- `BlockchainStatus` — статус TON сети (`GET /blockchain/health`)

**TQ queries:** `useListings({ limit: 8 })`, `useCategoryTree()`

---

### `/listings` — Каталог

**Компоненты:**
- `ListingFilters` (Sheet на мобиле / сайдбар на десктопе):
  - Поиск по тексту
  - Категория (select из `GET /categories`)
  - Цена min/max (два input)
  - Состояние (radio: new/used/refurbished)
  - Сортировка (select: дата/цена/просмотры)
- `ListingGrid` — `<ListingCard>` × N
- `PaginationControls`

**URL state:** все фильтры в searchParams (`?query=&category_id=&minPrice=&page=`)

**TQ:** `useListings(searchParams)` — `queryKey` зависит от всех фильтров

---

### `/listings/[id]` — Детали листинга

**Компоненты:**
- Галерея изображений
- Заголовок, цена, статус, категория, локация
- Описание
- Продавец: `UserAvatar`, рейтинг, ссылка на `/users/[id]`
- `BuyButton` (только если листинг `active` и не свой):
  - `POST /transactions` → redirect на `/transactions/[id]`
- Кнопка "Написать" → redirect на `/messages/[id]`
- `ReviewList` — отзывы (`GET /reviews/user/:sellerId`)
- `EscrowInfo` — если есть транзакция со статусом ≥ pending

**TQ:** `useListing(id)`, `useReviewsByUser(listing.seller_id)`

---

### `/listings/create` — Создать листинг `[protected]`

**Компоненты:**
- `ListingForm` (React Hook Form + Zod):
  - title, description (textarea), price, category (select), condition (radio), location
  - `ListingImageUpload` — drag-and-drop, `POST /files/upload`, preview
- Кнопка Submit → `useCreateListing()`

---

### `/listings/[id]/edit` — Редактировать `[protected, seller only]`

Аналогично создание, предзаполненная форма. `useListing(id)` + `useUpdateListing()`.

---

### `/users/[id]` — Публичный профиль

**Компоненты:**
- `ProfileHeader` — аватар, имя, кошелёк, рейтинг, кол-во сделок
- Табы:
  - **Листинги** — `GET /listings/user/:id` → `ListingGrid`
  - **Отзывы** — `GET /reviews/user/:id` → `ReviewList`

**TQ:** `useUser(id)`, `useUserListings(id)`, `useReviewsByUser(id)`

---

### `/transactions` — Мои сделки `[protected]`

**Компоненты:**
- Табы: **Покупки** / **Продажи** (фильтр на клиенте по `buyer_id` / `seller_id`)
- `TransactionCard` × N — статус, сумма, листинг, дата
- `PaginationControls`

**TQ:** `useTransactions({ page, limit })`

---

### `/transactions/[id]` — Детали сделки `[protected]`

**Компоненты:**
- `TransactionStepper` — визуальный прогресс:
  ```
  Создана → Оплачена → Подтверждена → Завершена
                             ↘ Спор → Решено
  ```
- Информация о листинге (мини-карточка)
- Покупатель / Продавец (аватары)
- `EscrowInfo` — адрес контракта, баланс (`GET /blockchain/balance/:address`, `GET /blockchain/escrow/:address`)
- `TransactionActions`:
  - Покупатель + статус `paid` → кнопка "Подтвердить получение" (`POST /transactions/:id/confirm`)
  - Любая сторона + статус `paid` → кнопка "Открыть спор" → `DisputeForm`
- `ReviewForm` — если статус `completed` и отзыв ещё не оставлен
- История статусов (таймлайн)

**TQ:** `useTransaction(id)`, `useBlockchainBalance(escrowAddress)`, `useEscrowState(escrowAddress)`

---

### `/messages` — Список чатов `[protected]`

**Компоненты:**
- `ChatList` — карточки чатов (`GET /messages/chats`):
  - Обложка листинга, название, последнее сообщение, дата
- Click → redirect `/messages/[listingId]`

**TQ:** `useChats()`

---

### `/messages/[listingId]` — Чат `[protected]`

**Компоненты:**
- Шапка — информация о листинге
- `ChatRoom`:
  - История (`GET /messages/history/:listingId`) + новые через WebSocket
  - `MessageBubble` — своё справа, чужое слева
  - `TypingIndicator`
  - Input + кнопка Send
- При первом открытии загружаем историю в state, потом дополняем через socket

**Hooks:** `useListingHistory(listingId)` + `useChat(listingId)` (WebSocket)

---

### `/profile` — Мой профиль `[protected]`

**Компоненты:**
- `ProfileHeader` — аватар, имя, адрес кошелька
- `ProfileEditForm` (RHF + Zod → `PATCH /users/:id`):
  - username, display_name, email, avatar_url
  - Avatar upload через `POST /files/upload`
- Статистика: рейтинг, продажи, покупки

**TQ:** `useCurrentUser()`, `useUpdateUser()`

---

### `/profile/listings` — Мои листинги `[protected]`

**Компоненты:**
- Табы: Активные / Зарезервированы / Проданы / Удалены
- `ListingGrid` с дополнительными кнопками (редактировать / удалить)
- `useDeleteListing()` с confirm диалогом (shadcn `AlertDialog`)

**TQ:** `useUserListings(currentUserId)` с фильтром по статусу

---

### `/notifications` — Уведомления `[protected]`

**Компоненты:**
- `NotificationList` — `GET /notifications?page=&limit=`
- `NotificationItem`:
  - Иконка по шаблону (transaction-created, transaction-completed, etc.)
  - Тема, дата
  - `StatusBadge`: pending (жёлтый) / sent (зелёный) / failed (красный)
- `PaginationControls`

**TQ:** `useNotifications({ page, limit })`

---

## Глобальные провайдеры (app/providers.tsx)

```tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }));

  return (
    <TonConnectUIProvider manifestUrl="/tonconnect-manifest.json">
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </TonConnectUIProvider>
  );
}
```

---

## Обработка ошибок

```tsx
// Глобальный error boundary + toast (shadcn Sonner)
// В мутациях:
const { mutate } = useCreateListing();

mutate(data, {
  onError: (err) => {
    if (err instanceof ApiError) {
      toast.error(err.message);
    }
  },
});

// 401 → автоматический logout в apiFetch → redirect на главную
```

---

## Защищённые маршруты

```tsx
// components/layout/AuthGuard.tsx
'use client';
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
```

Использовать в layout.tsx для групп `(protected)`.

---

## Переменные окружения (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_WS_URL=http://localhost:3000
NEXT_PUBLIC_TON_NETWORK=testnet
```

---

## tonconnect-manifest.json (public/)

```json
{
  "url": "http://localhost:3001",
  "name": "TON Marketplace",
  "iconUrl": "http://localhost:3001/icon.png"
}
```

---

## Порядок разработки

### Фаза 1 — Инфраструктура
1. `npx create-next-app@latest frontend --typescript --tailwind --app`
2. Установка shadcn: `npx shadcn@latest init`
3. Установка зависимостей: `tanstack-query`, `zustand`, `react-hook-form`, `zod`, `socket.io-client`, `@tonconnect/ui-react`, `@ton/ton`, `dayjs`, `sonner`
4. Настройка `Providers`, `AuthGuard`, `Navbar`
5. `lib/api/client.ts` + `lib/stores/auth.store.ts`
6. Все TypeScript типы (`types/api.ts`)

### Фаза 2 — Auth + Профиль
7. TON Connect flow (nonce → sign → JWT)
8. `/profile` — просмотр и редактирование
9. `/users/[id]` — публичный профиль

### Фаза 3 — Листинги (ядро)
10. `GET /listings` — каталог с фильтрами
11. `GET /listings/[id]` — детали
12. `POST /listings/create` — форма с загрузкой изображений
13. `PATCH /listings/[id]/edit` + `DELETE`
14. `/profile/listings` — управление своими

### Фаза 4 — Транзакции
15. `BuyButton` → `POST /transactions`
16. `/transactions` — список
17. `/transactions/[id]` — детали, stepper, escrow info
18. `confirmReceipt`, `openDispute`
19. `ReviewForm` после завершения

### Фаза 5 — Чат
20. WebSocket провайдер, `useChat` hook
21. `/messages` — список чатов
22. `/messages/[listingId]` — комната

### Фаза 6 — Остальное
23. `/notifications` — история
24. Интеграция `GET /blockchain/balance` в `EscrowInfo`
25. Категории в фильтрах
26. SEO: `generateMetadata` для листингов и профилей
27. Responsive polish, skeleton loading states, empty states
