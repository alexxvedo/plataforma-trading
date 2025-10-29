-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('MT4', 'MT5');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP');

-- CreateTable
CREATE TABLE "trading_account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "broker" TEXT NOT NULL,
    "platform" "Platform" NOT NULL DEFAULT 'MT5',
    "accountType" TEXT,
    "apiKey" TEXT NOT NULL,
    "apiKeyHash" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "isSlave" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trading_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_snapshot" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL,
    "equity" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "freeMargin" DOUBLE PRECISION NOT NULL,
    "marginLevel" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION NOT NULL,
    "credit" DOUBLE PRECISION,
    "leverage" INTEGER,
    "serverName" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION NOT NULL,
    "swap" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "openTime" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "magicNumber" INTEGER,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_history" (
    "id" TEXT NOT NULL,
    "tradingAccountId" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "openPrice" DOUBLE PRECISION NOT NULL,
    "closePrice" DOUBLE PRECISION NOT NULL,
    "stopLoss" DOUBLE PRECISION,
    "takeProfit" DOUBLE PRECISION,
    "profit" DOUBLE PRECISION NOT NULL,
    "swap" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "openTime" TIMESTAMP(3) NOT NULL,
    "closeTime" TIMESTAMP(3) NOT NULL,
    "comment" TEXT,
    "magicNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copy_trading_relation" (
    "id" TEXT NOT NULL,
    "masterAccountId" TEXT NOT NULL,
    "slaveAccountId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "riskMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "allowedSymbols" TEXT[],
    "maxLotSize" DOUBLE PRECISION,
    "minLotSize" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copy_trading_relation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trading_account_apiKey_key" ON "trading_account"("apiKey");

-- CreateIndex
CREATE INDEX "trading_account_userId_idx" ON "trading_account"("userId");

-- CreateIndex
CREATE INDEX "trading_account_apiKey_idx" ON "trading_account"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "trading_account_userId_accountNumber_broker_key" ON "trading_account"("userId", "accountNumber", "broker");

-- CreateIndex
CREATE INDEX "account_snapshot_tradingAccountId_timestamp_idx" ON "account_snapshot"("tradingAccountId", "timestamp");

-- CreateIndex
CREATE INDEX "position_tradingAccountId_idx" ON "position"("tradingAccountId");

-- CreateIndex
CREATE INDEX "position_symbol_idx" ON "position"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "position_tradingAccountId_ticket_key" ON "position"("tradingAccountId", "ticket");

-- CreateIndex
CREATE INDEX "trade_history_tradingAccountId_closeTime_idx" ON "trade_history"("tradingAccountId", "closeTime");

-- CreateIndex
CREATE INDEX "trade_history_symbol_idx" ON "trade_history"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "trade_history_tradingAccountId_ticket_key" ON "trade_history"("tradingAccountId", "ticket");

-- CreateIndex
CREATE INDEX "copy_trading_relation_masterAccountId_idx" ON "copy_trading_relation"("masterAccountId");

-- CreateIndex
CREATE INDEX "copy_trading_relation_slaveAccountId_idx" ON "copy_trading_relation"("slaveAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "copy_trading_relation_masterAccountId_slaveAccountId_key" ON "copy_trading_relation"("masterAccountId", "slaveAccountId");

-- AddForeignKey
ALTER TABLE "trading_account" ADD CONSTRAINT "trading_account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_snapshot" ADD CONSTRAINT "account_snapshot_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position" ADD CONSTRAINT "position_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_history" ADD CONSTRAINT "trade_history_tradingAccountId_fkey" FOREIGN KEY ("tradingAccountId") REFERENCES "trading_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_trading_relation" ADD CONSTRAINT "copy_trading_relation_masterAccountId_fkey" FOREIGN KEY ("masterAccountId") REFERENCES "trading_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copy_trading_relation" ADD CONSTRAINT "copy_trading_relation_slaveAccountId_fkey" FOREIGN KEY ("slaveAccountId") REFERENCES "trading_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
