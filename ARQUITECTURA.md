# 🏗️ Arquitectura de la Plataforma de Trading MT4/MT5

## 📐 Resumen de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          ARQUITECTURA COMPLETA                          │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐              ┌────────────────────────────────┐
│   MT4/MT5    │              │                                │
│   Terminal   │              │   Next.js Application          │
│              │              │   (Frontend + Backend)         │
│  ┌────────┐  │              │                                │
│  │   EA   │  │◄────HTTP────►│  ┌──────────────────────────┐  │
│  │ (MQL5) │  │   REST API   │  │   tRPC Routers           │  │
│  └────────┘  │              │  │  - trading-account       │  │
│              │              │  │  - copy-trading          │  │
│  Envía:      │              │  │  - ea (API especial)     │  │
│  - Balance   │              │  └──────────────────────────┘  │
│  - Equity    │              │                                │
│  - Posiciones│              │  ┌──────────────────────────┐  │
│  - Historial │              │  │   Prisma ORM             │  │
└──────────────┘              │  └──────────────────────────┘  │
                              │             │                  │
                              │             ▼                  │
                              │  ┌──────────────────────────┐  │
                              │  │   PostgreSQL Database    │  │
                              │  │  - Cuentas trading       │  │
                              │  │  - Snapshots             │  │
      ┌───────────────────────┤  │  - Posiciones            │  │
      │                       │  │  - Historial             │  │
      │  Frontend (React)     │  │  - Copy trading          │  │
      │                       │  └──────────────────────────┘  │
      │  - Dashboard          │                                │
      │  - Cuentas            │  ┌──────────────────────────┐  │
      │  - Posiciones live    │  │   Better Auth            │  │
      │  - Estadísticas       │  │  (Autenticación)         │  │
      │  - Copy trading       │  └──────────────────────────┘  │
      │                       │                                │
      └───────────────────────┴────────────────────────────────┘
```

## 🗄️ Base de Datos (Prisma Schema)

### Modelos Principales

#### 1. **TradingAccount** (Cuenta de Trading)
- Almacena información de cuentas MT4/MT5 registradas
- Cada cuenta tiene un `apiKey` único para autenticación del EA
- Flags `isMaster` / `isSlave` para copy trading
- Relacionado con el usuario propietario

```typescript
{
  id: string
  userId: string
  accountNumber: string
  broker: string
  platform: "MT4" | "MT5"
  apiKey: string (único, para autenticar EA)
  isActive: boolean
  isMaster: boolean
  isSlave: boolean
  lastSync: DateTime
}
```

#### 2. **AccountSnapshot** (Snapshot de Cuenta)
- Captura el estado de la cuenta en un momento dado
- Se crea cada vez que el EA envía actualización
- Permite histórico de balance/equity

```typescript
{
  tradingAccountId: string
  balance: number
  equity: number
  margin: number
  freeMargin: number
  marginLevel: number
  profit: number
  credit: number
  leverage: number
  timestamp: DateTime
}
```

#### 3. **Position** (Posición Abierta)
- Posiciones actualmente abiertas
- Se actualiza en tiempo real
- Se elimina cuando se cierra (pasa a TradeHistory)

```typescript
{
  tradingAccountId: string
  ticket: string
  symbol: string
  type: "BUY" | "SELL" | ...
  volume: number
  openPrice: number
  currentPrice: number
  stopLoss: number
  takeProfit: number
  profit: number
  swap: number
  commission: number
  openTime: DateTime
  magicNumber: number
  comment: string
}
```

#### 4. **TradeHistory** (Historial de Operaciones)
- Operaciones cerradas
- Datos de P&L final
- Para estadísticas y análisis

```typescript
{
  tradingAccountId: string
  ticket: string
  symbol: string
  type: "BUY" | "SELL" | ...
  volume: number
  openPrice: number
  closePrice: number
  profit: number
  swap: number
  commission: number
  openTime: DateTime
  closeTime: DateTime
}
```

#### 5. **CopyTradingRelation** (Relación Copy Trading)
- Define qué cuenta (slave) copia a qué cuenta (master)
- Configuración de multiplicador de riesgo
- Filtros por símbolos permitidos

```typescript
{
  masterAccountId: string
  slaveAccountId: string
  isActive: boolean
  riskMultiplier: number (1.0 = mismo lote, 0.5 = mitad, etc.)
  allowedSymbols: string[] ([] = todos)
  maxLotSize: number
  minLotSize: number
}
```

## 🔌 API Endpoints (tRPC)

### Router: `tradingAccount`

| Endpoint | Tipo | Descripción |
|----------|------|-------------|
| `getMyAccounts` | query | Obtener todas las cuentas del usuario |
| `getAccountById` | query | Obtener una cuenta específica con detalles |
| `createAccount` | mutation | Registrar nueva cuenta MT4/MT5 |
| `updateAccount` | mutation | Actualizar configuración de cuenta |
| `deleteAccount` | mutation | Eliminar cuenta |
| `regenerateApiKey` | mutation | Regenerar API Key (si comprometida) |
| `getAccountStats` | query | Estadísticas completas de una cuenta |

**Ejemplo de uso (desde frontend):**
```typescript
const { data: accounts } = trpc.tradingAccount.getMyAccounts.useQuery();
```

### Router: `copyTrading`

| Endpoint | Tipo | Descripción |
|----------|------|-------------|
| `getMyRelations` | query | Obtener todas las relaciones del usuario |
| `getMasterRelations` | query | Relaciones donde una cuenta es master |
| `getSlaveRelations` | query | Relaciones donde una cuenta es slave |
| `createRelation` | mutation | Crear relación de copy trading |
| `updateRelation` | mutation | Actualizar configuración de copy trading |
| `deleteRelation` | mutation | Eliminar relación |

### Router: `ea` (Endpoints para Expert Advisor)

**Autenticación:** API Key en header `Authorization: Bearer <apiKey>`

| Endpoint | Tipo | Descripción |
|----------|------|-------------|
| `ping` | query | Test de conexión |
| `sendSnapshot` | mutation | Enviar snapshot de cuenta |
| `syncPositions` | mutation | Sincronizar todas las posiciones (reemplaza) |
| `updatePosition` | mutation | Actualizar una posición específica |
| `closePosition` | mutation | Cerrar posición (mover a historial) |
| `syncHistory` | mutation | Sincronizar historial de operaciones |

**Ruta API:** `/api/ea/[trpc]`

**Ejemplo de llamada desde EA (MQL5):**
```cpp
string url = "https://your-domain.com/api/ea/sendSnapshot";
string headers = "Authorization: Bearer ta_abc123...\r\n";
headers += "Content-Type: application/json\r\n";
string json = "{\"balance\":10000,\"equity\":10150,...}";
WebRequest("POST", url, headers, 5000, data, result, resultHeaders);
```

## 🤖 Expert Advisor (EA)

### Archivo: `mt5-ea/TradingPlatformConnector.mq5`

### Parámetros de Configuración

```cpp
input string API_URL = "https://your-domain.com/api/ea";
input string API_KEY = "ta_...";              // API Key única
input int    UPDATE_INTERVAL = 5;             // Actualizar cada 5 seg
input bool   SEND_HISTORY = true;             // Sincronizar historial
input int    HISTORY_DAYS = 30;               // Días de historial
```

### Funcionalidades

1. **Inicialización:**
   - Valida API Key
   - Test de conexión al servidor
   - Sincroniza historial (si `SEND_HISTORY = true`)
   - Envía snapshot inicial
   - Sincroniza posiciones abiertas

2. **En ejecución continua:**
   - Timer cada `UPDATE_INTERVAL` segundos:
     - Envía snapshot actualizado
     - Actualiza P&L de posiciones
   
3. **En eventos de trade:**
   - Detecta nuevas operaciones
   - Detecta cierre de posiciones
   - Sincroniza inmediatamente

### Funciones Principales

| Función | Descripción |
|---------|-------------|
| `OnInit()` | Inicialización, test de conexión |
| `OnTimer()` | Se ejecuta cada X segundos |
| `OnTrade()` | Se ejecuta al detectar operación nueva/cerrada |
| `TestConnection()` | Ping al servidor |
| `SendAccountSnapshot()` | Enviar balance, equity, margin, etc. |
| `SyncPositions()` | Enviar todas las posiciones abiertas |
| `UpdatePositions()` | Actualizar posiciones en tiempo real |
| `SyncHistory()` | Enviar historial de operaciones |

## 🔐 Seguridad

### Autenticación de Usuarios
- **Better Auth**: Sistema de autenticación del usuario en el frontend
- Email + Password
- Sesiones con tokens

### Autenticación de EAs
- **API Key única** por cuenta de trading
- Se genera automáticamente al crear cuenta
- Se envía en header `Authorization: Bearer <apiKey>`
- Validación en middleware tRPC
- Se puede regenerar si es comprometida

### Flujo de Autenticación EA

```
EA → POST /api/ea/ping
     Header: Authorization: Bearer ta_abc123...

Backend → Middleware isEAAuthenticated
       → SELECT * FROM trading_account WHERE apiKey = 'ta_abc123...'
       → Si existe y isActive = true → ✓ Autorizado
       → Si no existe → ❌ 401 Unauthorized
```

## 📊 Flujo de Datos en Tiempo Real

### 1. EA → Backend

```
EA (MQL5)
  │
  │ POST /api/ea/sendSnapshot (cada 5s)
  │ {balance: 10000, equity: 10150, ...}
  │
  ▼
Backend (tRPC)
  │
  │ Middleware: Valida API Key
  │
  ▼
Prisma
  │
  │ INSERT INTO account_snapshot
  │ UPDATE trading_account.lastSync
  │
  ▼
PostgreSQL
```

### 2. Backend → Frontend (Futuro: WebSockets)

**Actualmente:** Polling (el frontend consulta periódicamente)
**Próximo paso:** tRPC Subscriptions con WebSockets

```typescript
// Frontend futuro con subscriptions
const positions = trpc.tradingAccount.subscribeToPositions
  .useSubscription({ accountId: "..." });

// Se actualiza automáticamente cuando EA envía datos
```

## 🔄 Copy Trading - Arquitectura

### Flujo de Copy Trading (Futuro)

```
Master EA → Abre posición EURUSD 0.1 lotes
     │
     ▼
Backend detecta nueva posición en cuenta Master
     │
     ▼
Backend busca relaciones activas:
  CopyTradingRelation where masterAccountId = X
     │
     ▼
Para cada Slave:
  - Aplicar riskMultiplier (0.1 * 1.5 = 0.15 lotes)
  - Verificar allowedSymbols (EURUSD permitido?)
  - Verificar maxLotSize / minLotSize
  - Generar señal de trading
     │
     ▼
Slave EA recibe señal (via polling o WebSocket)
     │
     ▼
Slave EA ejecuta orden en MT5
```

### Configuración de Copy Trading

```typescript
// Crear relación master → slave
await trpc.copyTrading.createRelation.mutate({
  masterAccountId: "master_123",
  slaveAccountId: "slave_456",
  riskMultiplier: 1.5,           // Copiar con 1.5x el tamaño
  allowedSymbols: ["EURUSD", "GBPUSD"], // Solo estos pares
  maxLotSize: 1.0,               // Máximo 1 lote
  minLotSize: 0.01,              // Mínimo 0.01 lote
});
```

## 📁 Estructura de Archivos

```
plataforma-trading/
│
├── prisma/
│   └── schema.prisma              ✅ Modelos de BD
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ea/
│   │   │   │   └── [trpc]/
│   │   │   │       └── route.ts   ✅ Endpoint para EA
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts   ✅ Endpoint tRPC principal
│   │   └── dashboard/             🔜 Dashboard frontend
│   │
│   ├── trpc/
│   │   ├── init.ts                ✅ Configuración tRPC
│   │   └── routers/
│   │       ├── _app.ts            ✅ Router principal
│   │       ├── trading-account.ts ✅ Gestión de cuentas
│   │       ├── copy-trading.ts    ✅ Copy trading
│   │       └── ea.ts              ✅ Endpoints para EA
│   │
│   └── lib/
│       ├── db.ts                  ✅ Cliente Prisma
│       └── auth.ts                ✅ Better Auth config
│
└── mt5-ea/
    ├── TradingPlatformConnector.mq5  ✅ Expert Advisor
    └── README.md                     ✅ Instrucciones EA
```

## ✅ Estado Actual del Proyecto

### ✔️ Completado

1. ✅ **Schema de Base de Datos** (Prisma)
   - Modelos para cuentas, snapshots, posiciones, historial, copy trading
   
2. ✅ **API Backend Completa** (tRPC)
   - Router `tradingAccount`: CRUD de cuentas
   - Router `copyTrading`: Gestión de relaciones
   - Router `ea`: Endpoints para Expert Advisor
   
3. ✅ **Sistema de Autenticación**
   - API Keys únicas por cuenta
   - Middleware de validación
   
4. ✅ **Expert Advisor MQL5**
   - Conexión HTTP al backend
   - Sincronización de snapshots
   - Sincronización de posiciones
   - Sincronización de historial
   - Actualización en tiempo real

### 🔜 Pendiente

1. ⏳ **Ejecutar Migración de Prisma**
   - Requiere conexión a la base de datos
   - Comando: `npx prisma migrate dev`

2. ⏳ **WebSocket / tRPC Subscriptions**
   - Para actualizaciones en tiempo real frontend ↔ backend
   - Evitar polling constante

3. ⏳ **Dashboard Frontend**
   - Vista de cuentas
   - Vista de posiciones en tiempo real
   - Gráficos de equity
   - Estadísticas

4. ⏳ **Lógica de Copy Trading**
   - Detector de nuevas posiciones en master
   - Procesador de señales
   - Envío de órdenes a slaves
   - Gestión de errores

5. ⏳ **EA para Slave (Copy Trading)**
   - EA que recibe señales
   - Ejecuta órdenes automáticamente

## 🚀 Próximos Pasos

### Paso 1: Ejecutar Migración
```bash
npx prisma migrate dev --name add_trading_models
```

### Paso 2: Probar Conexión EA
1. Registrar una cuenta en el dashboard
2. Copiar el API Key
3. Configurar el EA en MT5
4. Verificar que los datos llegan al backend

### Paso 3: Crear Dashboard Frontend
- Página para ver cuentas
- Página para ver posiciones en tiempo real
- Gráficos de equity/balance

### Paso 4: Implementar Copy Trading
- Lógica de detección de operaciones master
- Sistema de replicación a slaves
- EA slave que recibe señales

## 📞 Testing de la API

### Desde Postman/Insomnia

**Ejemplo: Ping desde EA**
```
POST https://your-domain.com/api/ea/ping
Headers:
  Authorization: Bearer ta_abc123...
  Content-Type: application/json
```

**Ejemplo: Enviar Snapshot**
```
POST https://your-domain.com/api/ea/sendSnapshot
Headers:
  Authorization: Bearer ta_abc123...
  Content-Type: application/json
Body:
{
  "balance": 10000,
  "equity": 10150,
  "margin": 500,
  "freeMargin": 9650,
  "marginLevel": 2030,
  "profit": 150,
  "credit": 0,
  "leverage": 100,
  "serverName": "BrokerName-Server"
}
```

---

## 📚 Documentación Adicional

- [Prisma Docs](https://www.prisma.io/docs)
- [tRPC Docs](https://trpc.io/docs)
- [MQL5 Reference](https://www.mql5.com/en/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0


