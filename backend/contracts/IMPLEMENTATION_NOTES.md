# Заметки по реализации смарт-контракта

## Текущий статус (MVP)

### ✅ Реализовано

1. **FunC контракт** (`escrow.fc`)
   - Хранение данных сделки (продавец, покупатель, сумма)
   - Статусы: CREATED, FUNDED, RELEASED, REFUNDED
   - OP коды для операций (fund, release, refund)
   - GET методы для чтения состояния
   - Автоматический возврат по таймауту (30 дней)
   - Защита от несанкционированного доступа
   - Возврат излишков при переплате

2. **TypeScript Wrapper** (`wrappers/Escrow.ts`)
   - Класс Escrow для работы с контрактом
   - Методы для деплоя и взаимодействия
   - Типизация данных контракта
   - Интеграция с @ton/core

3. **Тесты** (`tests/Escrow.spec.ts`)
   - 12 unit тестов покрывают основные сценарии
   - Проверка деплоя, оплаты, освобождения средств
   - Тесты безопасности (unauthorized access)
   - Тест таймаута и автовозврата

4. **Backend интеграция** (`src/modules/blockchain/services/escrow.service.ts`)
   - Загрузка скомпилированного контракта
   - Создание экземпляров контракта
   - Методы для release/refund (заглушки для MVP)
   - Получение состояния контракта

### ⚠️ Упрощения для MVP

1. **Деплой контракта**
   - Генерируется адрес, но реальный деплой НЕ выполняется
   - Требуется админ wallet с балансом для деплоя
   - Нужна интеграция с TonConnect/WalletV4

2. **Транзакции release/refund**
   - Методы только логируют операции
   - Реальная отправка транзакций закомментирована
   - Требуется wallet для подписи

3. **Компиляция**
   - Скрипт компиляции создан, но зависит от `@ton-community/func-js`
   - Требуется установка: `npm install @ton-community/func-js @ton/crypto`
   - Альтернатива: ручная компиляция через `func`

## Что нужно для Production

### 1. Установить зависимости

```bash
npm install @ton-community/func-js @ton/crypto
```

### 2. Скомпилировать контракт

```bash
npm run contract:compile
```

Это создаст файл `contracts/build/escrow.compiled.json`

### 3. Настроить админ wallet

В `.env` добавить mnemonic:

```env
TON_ADMIN_WALLET_MNEMONIC="word1 word2 word3 ... word24"
```

Этот wallet будет использоваться для:
- Деплоя контрактов
- Разрешения споров (release/refund)

### 4. Реализовать реальный деплой

В `escrow.service.ts` раскомментировать и доработать:

```typescript
// Отправить init транзакцию
const sender = this.adminWallet.sender(client);
await escrow.sendDeploy(provider, sender, toNano('0.05'));

// Дождаться подтверждения
await waitForDeploy(escrow, provider);
```

### 5. Реализовать release/refund транзакции

```typescript
async release(contractAddress: string): Promise<void> {
  const address = Address.parse(contractAddress);
  const client = await this.tonClientService.getClient();
  const escrow = client.open(new Escrow(address));

  const sender = this.adminWallet.sender(client);
  await escrow.sendRelease(client, sender);
}
```

### 6. Мониторинг транзакций

Создать сервис для отслеживания:
- Когда покупатель оплатил (OP 1)
- Когда средства освобождены (OP 2)
- Когда произошел возврат (OP 3)

Можно использовать:
- TON HTTP API (polling)
- TON Index API
- WebSocket subscriptions

### 7. Keeper для таймаутов

Создать cron job или worker для проверки:
- Какие контракты просрочены (timeout passed)
- Автоматический вызов refund для просроченных

### 8. Оптимизации

**Вариант 1: Factory контракт**
Вместо деплоя контракта на каждую сделку, использовать один контракт-фабрику:
- Экономия на деплое
- Упрощение управления
- Меньше адресов для отслеживания

**Вариант 2: Batch операции**
Группировать несколько операций в одну транзакцию

## Архитектурные решения

### Почему отдельный контракт на сделку?

**Плюсы:**
- ✅ Полная изоляция средств
- ✅ Простая логика контракта
- ✅ Легко аудировать
- ✅ Нет shared state

**Минусы:**
- ❌ Дорого (деплой ~0.05 TON)
- ❌ Много адресов для мониторинга
- ❌ Требует баланс на админ wallet

### Альтернативы

1. **Один контракт для всех сделок**
   - Сложнее логика
   - Риск багов в shared state
   - Экономия на деплое

2. **Hybrid: Factory + детские контракты**
   - Factory управляет детскими контрактами
   - Детские контракты деплоятся через factory
   - Экономия газа через оптимизированный код

## Безопасность

### Реализованные проверки

- ✅ Только покупатель может оплатить (fund)
- ✅ Только покупатель или админ могут release
- ✅ Только админ может refund до таймаута
- ✅ Проверка суммы при оплате
- ✅ Проверка статуса перед операциями
- ✅ Защита от повторного выполнения

### Дополнительные меры для Production

- [ ] Мультисиг для админа
- [ ] Ограничение максимальной суммы сделки
- [ ] Emergency pause механизм
- [ ] Аудит контракта специалистами
- [ ] Bug bounty программа

## Тестирование

### Локальное тестирование

```bash
# Unit тесты
npm test contracts/tests/Escrow.spec.ts

# Все тесты
npm test
```

### Testnet тестирование

1. Получить testnet TON с faucet
2. Создать testnet wallet
3. Задеплоить контракт
4. Протестировать полный flow вручную

### Mainnet checklist

- [ ] Полное покрытие тестами
- [ ] Аудит контракта
- [ ] Тестирование на testnet
- [ ] Мониторинг настроен
- [ ] Backup средств настроен
- [ ] Emergency contacts готовы
- [ ] Документация обновлена

## Полезные команды

```bash
# Компиляция контракта
npm run contract:compile

# Тестирование
npm test contracts/tests/Escrow.spec.ts

# Деплой (когда реализован)
ts-node contracts/scripts/deployEscrow.ts

# Проверка состояния контракта
ts-node contracts/scripts/checkContract.ts <address>
```

## Ссылки

- [TON Documentation](https://docs.ton.org/)
- [FunC Documentation](https://docs.ton.org/develop/func/overview)
- [@ton/core Documentation](https://github.com/ton-org/ton-core)
- [TON Examples](https://github.com/ton-blockchain/ton/tree/master/crypto/smartcont)
