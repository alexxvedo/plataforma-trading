-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` VARCHAR(191) NULL,
    `refreshToken` VARCHAR(191) NULL,
    `idToken` VARCHAR(191) NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trading_account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `broker` VARCHAR(191) NOT NULL,
    `platform` ENUM('MT4', 'MT5') NOT NULL DEFAULT 'MT5',
    `accountType` VARCHAR(191) NULL,
    `apiKey` VARCHAR(191) NOT NULL,
    `apiKeyHash` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `lastSync` DATETIME(3) NULL,
    `isMaster` BOOLEAN NOT NULL DEFAULT false,
    `isSlave` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `trading_account_apiKey_key`(`apiKey`),
    INDEX `trading_account_userId_idx`(`userId`),
    INDEX `trading_account_apiKey_idx`(`apiKey`),
    UNIQUE INDEX `trading_account_userId_accountNumber_broker_key`(`userId`, `accountNumber`, `broker`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account_snapshot` (
    `id` VARCHAR(191) NOT NULL,
    `tradingAccountId` VARCHAR(191) NOT NULL,
    `balance` DOUBLE NOT NULL,
    `equity` DOUBLE NOT NULL,
    `margin` DOUBLE NOT NULL,
    `freeMargin` DOUBLE NOT NULL,
    `marginLevel` DOUBLE NULL,
    `profit` DOUBLE NOT NULL,
    `credit` DOUBLE NULL,
    `leverage` INTEGER NULL,
    `serverName` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `account_snapshot_tradingAccountId_timestamp_idx`(`tradingAccountId`, `timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `position` (
    `id` VARCHAR(191) NOT NULL,
    `tradingAccountId` VARCHAR(191) NOT NULL,
    `ticket` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `type` ENUM('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP') NOT NULL,
    `volume` DOUBLE NOT NULL,
    `openPrice` DOUBLE NOT NULL,
    `currentPrice` DOUBLE NULL,
    `stopLoss` DOUBLE NULL,
    `takeProfit` DOUBLE NULL,
    `profit` DOUBLE NOT NULL,
    `swap` DOUBLE NULL,
    `commission` DOUBLE NULL,
    `openTime` DATETIME(3) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `comment` VARCHAR(191) NULL,
    `magicNumber` INTEGER NULL,

    INDEX `position_tradingAccountId_idx`(`tradingAccountId`),
    INDEX `position_symbol_idx`(`symbol`),
    UNIQUE INDEX `position_tradingAccountId_ticket_key`(`tradingAccountId`, `ticket`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trade_history` (
    `id` VARCHAR(191) NOT NULL,
    `tradingAccountId` VARCHAR(191) NOT NULL,
    `ticket` VARCHAR(191) NOT NULL,
    `symbol` VARCHAR(191) NOT NULL,
    `type` ENUM('BUY', 'SELL', 'BUY_LIMIT', 'SELL_LIMIT', 'BUY_STOP', 'SELL_STOP') NOT NULL,
    `volume` DOUBLE NOT NULL,
    `openPrice` DOUBLE NOT NULL,
    `closePrice` DOUBLE NOT NULL,
    `stopLoss` DOUBLE NULL,
    `takeProfit` DOUBLE NULL,
    `profit` DOUBLE NOT NULL,
    `swap` DOUBLE NULL,
    `commission` DOUBLE NULL,
    `openTime` DATETIME(3) NOT NULL,
    `closeTime` DATETIME(3) NOT NULL,
    `comment` VARCHAR(191) NULL,
    `magicNumber` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `trade_history_tradingAccountId_closeTime_idx`(`tradingAccountId`, `closeTime`),
    INDEX `trade_history_symbol_idx`(`symbol`),
    UNIQUE INDEX `trade_history_tradingAccountId_ticket_key`(`tradingAccountId`, `ticket`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `copy_trading_relation` (
    `id` VARCHAR(191) NOT NULL,
    `masterAccountId` VARCHAR(191) NOT NULL,
    `slaveAccountId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `riskMultiplier` DOUBLE NOT NULL DEFAULT 1.0,
    `allowedSymbols` JSON NOT NULL,
    `maxLotSize` DOUBLE NULL,
    `minLotSize` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `copy_trading_relation_masterAccountId_idx`(`masterAccountId`),
    INDEX `copy_trading_relation_slaveAccountId_idx`(`slaveAccountId`),
    UNIQUE INDEX `copy_trading_relation_masterAccountId_slaveAccountId_key`(`masterAccountId`, `slaveAccountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
