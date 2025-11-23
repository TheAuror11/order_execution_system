# Order Execution Engine (Mock, Market Order, DEX Router)

## Overview

This backend accepts market orders, simulates price fetching from two DEXes (Raydium/Meteora), routes to the best simulated price, executes a mock trade, and streams real-time status updates via WebSocket. Built for Fastify + TypeScript, BullMQ + Redis queue, and PostgreSQL order history.

- **Order Submission:** `POST /api/orders/execute` — returns orderId, queueing the order.
- **WebSocket Lifecycle:** `ws://host/ws/orders/{orderId}` — streams status changes: `pending → routing → building → submitted → confirmed` (or `failed`).
- **Concurrent Processing:** BullMQ, up to 10 parallel orders, with retry and status streaming.
- **Persistence:** PostgreSQL stores all history; Redis for active order state.
- **Mock Implementation:** All DEX operations are simulated (2-3s delays). Database and queue are real, but no actual blockchain transactions occur.

## Why Market Orders?

Market orders are the most straightforward, suitable for simulating DEX routing logic and live updates. Limit/sniper orders can be added by holding orders in the queue and watching simulated price/pool events before routing using the same engine pattern.

## How to Extend

- **Limit Orders:** Store order until a DEX quote is at or better than the limit, then process as above.
- **Sniper Orders:** Hold until liquidity or token launch event is detected, then execute order immediately through router.

## Quick Start

**For detailed setup instructions, see [USAGE_GUIDE.md](./USAGE_GUIDE.md)**

### Minimal Setup (5 minutes)

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up databases:**

   ```bash
   # Run migration
   npm run migrate

   # Start Redis (if not running)
   redis-server
   ```

3. **Configure environment:**

   ```bash
   # Create .env file
   vi .env

   #Paste
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # PostgreSQL Configuration
   PGHOST=localhost
   PGPORT=5432
   PGUSER=postgres_user
   PGPASSWORD=postgres_password
   PGDATABASE=orders

   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   ```

4. **Start server:**

   ```bash
   npm run dev
   ```

## Usage

### Submit Order

```http
POST /api/orders/execute
{
  "userId": "user1",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 2
}
```

**Returns:**

```json
{ "orderId": "uuid" }
```

### Subscribe for Status

Connect WebSocket to:

```
ws://localhost:3000/ws/orders/{orderId}
```

Status flow:

- `pending` — order received
- `routing` — fetching simulated prices from mock DEXes
- `building` — constructing mock swap
- `submitted` — simulated transaction sent
- `confirmed` — success result with {txHash (simulated), executedPrice (simulated)}
- `failed` — if any step fails

### Query Order Status

```http
GET /api/orders/status/{orderId}
```

### Fetch Completed Order

```http
GET /api/orders/{orderId}
```

**Returns full order record:**

```json
{
  "orderId": "550e...",
  "userId": "user1",
  "type": "market",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 2,
  "status": "confirmed",
  "dexUsed": "meteora",
  "executedPrice": 98.7,
  "txHash": "81f1...",
  "failReason": null,
  "createdAt": "2025-11-21T10:00:00.000Z"
}
```

## HTTP → WebSocket Upgrade Pattern

The `POST /api/orders/execute` endpoint supports WebSocket upgrade for live updates:

**Option 1: Standard HTTP Response**

```bash
POST /api/orders/execute
# Returns: { "orderId": "..." }
# Then connect to: ws://host/ws/orders/{orderId}
```

**Option 2: WebSocket Upgrade (Query Parameter)**

```bash
POST /api/orders/execute?upgrade=ws
# Returns: { "orderId": "...", "websocketUrl": "/ws/orders/{orderId}" }
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate coverage report:

```bash
npm run test:coverage
```

**Test Coverage:**

- DEX routing logic (price comparison, best DEX selection)
- Queue behavior (concurrent orders, order integrity)
- WebSocket lifecycle (connection, messages, disconnection)
- Order execution flow (status updates, retry logic)
- Error handling and failure scenarios

**Total Tests:** 30 unit and integration tests covering all core functionality.

### Public URL

**Public URL:** `http://13.204.217.135:8000`

## Queue

- Processes up to 10 orders concurrently, >100/min supported.
- Retries each order max 3 times.

## Architecture

```
src/
├── server.ts                      # Server entry point, sets up Fastify
├── controllers/
│   └── orderController.ts         # Business logic for order endpoints
├── routes/
│   └── orderRoutes.ts             # Route definitions
├── types/                         # Type definitions
│   ├── order.ts                   # Order model/domain types
│   ├── controller.ts              # Controller request/response types
│   └── index.ts                   # Type exports
├── db/
│   ├── index.ts                   # Database connection
│   └── orderRepo.ts               # Data access layer (repository pattern)
├── core/                          # Core business logic
│   ├── orderEngine.ts             # Order execution engine
│   ├── MockDexRouter.ts           # Mock DEX routing logic
│   └── tokenRegistry.ts           # Token registry
├── queue/                         # Queue management
│   ├── queue.ts                   # BullMQ queue setup
│   └── worker.ts                  # Queue worker
├── ws/                            # WebSocket management
│   └── wsManager.ts               # WebSocket client manager
├── utils/                         # Utility functions
│   ├── logger.ts                  # Logging utility
│   └── sleep.ts                   # Sleep utility
└── config/                        # Configuration
    └── index.ts                   # App configuration
```

**Key Components:**

- **src/server.ts**: Fastify server initialization and startup
- **src/types/**: Centralized TypeScript type definitions (Order, OrderStatus, request/response types)
- **src/core**: Order execution engine and mock DEX router.
- **src/queue**: BullMQ setup and workers for async order processing
- **src/ws**: WebSocket connections manager for real-time status updates
- **src/db**: PostgreSQL connection and order repository
- **src/controllers**: Request handlers and business logic coordination
- **src/routes**: Route definitions mapping endpoints to controllers
- **src/utils**: Shared utility functions
- **tests/**: Comprehensive test suite with 30 tests.
