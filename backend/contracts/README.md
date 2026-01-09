# TON Marketplace Escrow Smart Contract

Эскроу смарт-контракт для безопасных P2P транзакций на TON блокчейне.

## Описание

Контракт реализует классическую схему эскроу для торговой платформы:

1. **Покупатель** отправляет средства в контракт
2. Средства блокируются до подтверждения сделки
3. **Продавец** отправляет товар
4. **Покупатель** подтверждает получение → средства переходят продавцу
5. При споре **администратор** принимает решение

## Состояния контракта

```
0 - CREATED   (контракт создан, ожидание оплаты)
1 - FUNDED    (средства получены, сделка активна)
2 - RELEASED  (средства переведены продавцу)
3 - REFUNDED  (средства возвращены покупателю)
```

## Операции (OP codes)

### OP 1: Fund (Оплата)
- **Отправитель**: Покупатель
- **Сумма**: Цена товара
- **Действие**: Блокирует средства в контракте
- **Требования**: Статус = CREATED, отправитель = buyer

### OP 2: Release (Освобождение средств)
- **Отправители**: Покупатель ИЛИ Администратор
- **Действие**: Переводит средства продавцу
- **Требования**: Статус = FUNDED

### OP 3: Refund (Возврат средств)
- **Отправители**: Администратор ИЛИ Любой (после timeout)
- **Действие**: Возвращает средства покупателю
- **Требования**: Статус = FUNDED

## Безопасность

### Проверки
- ✅ Только покупатель может оплатить
- ✅ Только покупатель или админ могут освободить средства
- ✅ Автоматический возврат по таймауту (30 дней)
- ✅ Защита от повторного выполнения операций
- ✅ Проверка достаточности суммы при оплате
- ✅ Возврат излишков при переплате

### Коды ошибок
```
100 - ERROR_NOT_FUNDED          (контракт не оплачен)
101 - ERROR_ALREADY_COMPLETED   (операция уже выполнена)
102 - ERROR_UNAUTHORIZED        (нет прав на операцию)
103 - ERROR_INSUFFICIENT_AMOUNT (недостаточная сумма)
104 - ERROR_TIMEOUT_NOT_REACHED (таймаут еще не наступил)
```

## GET методы

- `get_status()` → int - текущий статус
- `get_contract_data()` → (seller, buyer, amount, timeout, status, admin)
- `get_seller()` → address - адрес продавца
- `get_buyer()` → address - адрес покупателя
- `get_amount()` → int - сумма сделки
- `get_timeout()` → int - время автовозврата
- `is_timeout_passed()` → bool - истек ли таймаут
- `get_admin()` → address - адрес администратора

## Использование

### Деплой контракта

```typescript
import { Escrow } from './wrappers/Escrow';
import { toNano, Address } from '@ton/core';

const escrow = Escrow.createFromConfig({
  sellerAddress: Address.parse('EQ...seller...'),
  buyerAddress: Address.parse('EQ...buyer...'),
  amount: toNano('10'), // 10 TON
  timeout: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 days
  adminAddress: Address.parse('EQ...admin...'),
}, code);

await provider.deploy(escrow, toNano('0.05'));
```

### Оплата (покупатель)

```typescript
await escrow.sendFund(provider, buyer, toNano('10'));
```

### Подтверждение получения (покупатель)

```typescript
await escrow.sendRelease(provider, buyer);
```

### Разрешение спора (администратор)

```typescript
// Перевод продавцу
await escrow.sendRelease(provider, admin);

// ИЛИ возврат покупателю
await escrow.sendRefund(provider, admin);
```

### Проверка статуса

```typescript
const status = await escrow.getStatus(provider);
const data = await escrow.getContractData(provider);
console.log('Status:', status);
console.log('Amount:', data.amount);
```

## Flow транзакции

```
1. Backend деплоит контракт с параметрами сделки
   └─→ Status: CREATED

2. Покупатель отправляет средства (OP 1)
   └─→ Status: FUNDED

3a. Покупатель подтверждает получение (OP 2)
    └─→ Status: RELEASED → Средства продавцу

3b. ИЛИ открывается спор
    └─→ Админ вызывает OP 2 (release) или OP 3 (refund)
        └─→ Status: RELEASED или REFUNDED

3c. ИЛИ проходит 30 дней без действий
    └─→ Любой может вызвать OP 3 (refund)
        └─→ Status: REFUNDED → Средства покупателю
```

## Gas fees

- **Deploy**: ~0.05 TON
- **Fund**: ~0.01 TON
- **Release**: ~0.05 TON
- **Refund**: ~0.05 TON

## Ограничения MVP

- Контракт деплоится для каждой сделки (дорого в mainnet)
- Нет мультисига для админа
- Нет истории изменений в контракте
- Нет механизма частичного освобождения средств

## TODO для Production

- [ ] Factory контракт для экономии газа
- [ ] Мультисиг для критичных операций
- [ ] События (logs) для индексации
- [ ] Поддержка jettons (токенов)
- [ ] Механизм апгрейда контракта
- [ ] Расширенная система споров с медиаторами
- [ ] Интеграция с оракулами для автоматизации

## Компиляция

```bash
# Используя Blueprint
npx blueprint build

# Или напрямую с func
func -o escrow.fif -SPA escrow.fc
```

## Тестирование

```bash
npx blueprint test
```

## Лицензия

MIT
