import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import prisma from "@/lib/db";

// Create a separate tRPC instance for EA endpoints (no user auth, uses API key)
const t = initTRPC.create();

// Type for EA context
type EAContext = {
  apiKey: string;
  tradingAccount?: {
    id: string;
    userId: string;
    accountNumber: string;
    broker: string;
    platform: string;
    isActive: boolean;
  };
};

// Middleware to authenticate EA via API key
const isEAAuthenticated = t.middleware(async ({ ctx, next }) => {
  // API key should be in the context (set from headers in the API route)
  const apiKey = (ctx as EAContext).apiKey;

  if (!apiKey) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "API key is required",
    });
  }

  // Find trading account by API key
  const tradingAccount = await prisma.tradingAccount.findUnique({
    where: { apiKey },
  });

  if (!tradingAccount) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid API key",
    });
  }

  if (!tradingAccount.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Trading account is disabled",
    });
  }

  return next({
    ctx: {
      ...ctx,
      tradingAccount,
    },
  });
});

const eaProcedure = t.procedure.use(isEAAuthenticated);

// Validation schemas
const accountSnapshotSchema = z.object({
  balance: z.number(),
  equity: z.number(),
  margin: z.number(),
  freeMargin: z.number(),
  marginLevel: z.number().optional(),
  profit: z.number(),
  credit: z.number().optional(),
  leverage: z.number().int().optional(),
  serverName: z.string().optional(),
});

const positionSchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  type: z.enum(["BUY", "SELL", "BUY_LIMIT", "SELL_LIMIT", "BUY_STOP", "SELL_STOP"]),
  volume: z.number(),
  openPrice: z.number(),
  currentPrice: z.number().optional(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  profit: z.number(),
  swap: z.number().optional(),
  commission: z.number().optional(),
  openTime: z.string().datetime(), // ISO datetime string
  comment: z.string().optional(),
  magicNumber: z.number().int().optional(),
});

const tradeHistorySchema = z.object({
  ticket: z.string(),
  symbol: z.string(),
  type: z.enum(["BUY", "SELL", "BUY_LIMIT", "SELL_LIMIT", "BUY_STOP", "SELL_STOP"]),
  volume: z.number(),
  openPrice: z.number(),
  closePrice: z.number(),
  stopLoss: z.number().optional(),
  takeProfit: z.number().optional(),
  profit: z.number(),
  swap: z.number().optional(),
  commission: z.number().optional(),
  openTime: z.string().datetime(),
  closeTime: z.string().datetime(),
  comment: z.string().optional(),
  magicNumber: z.number().int().optional(),
});

export const eaRouter = t.router({
  // Heartbeat - EA calls this to confirm connection
  // Changed to mutation so it accepts POST requests from EA
  ping: eaProcedure.mutation(({ ctx }) => {
    return {
      success: true,
      accountId: ctx.tradingAccount.id,
      timestamp: new Date().toISOString(),
    };
  }),

  // Check if there are active users viewing this account
  checkActivity: eaProcedure.mutation(async ({ ctx }) => {
    const { tradingAccount } = ctx;
    
    // Check if user has recent session activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const activeSessions = await prisma.session.count({
      where: {
        userId: tradingAccount.userId,
        expiresAt: {
          gt: new Date(), // Session not expired
        },
        updatedAt: {
          gt: fiveMinutesAgo, // Activity in last 5 minutes
        },
      },
    });
    
    return {
      success: true,
      isActive: activeSessions > 0,
      accountId: tradingAccount.id,
    };
  }),

  // Send account snapshot
  sendSnapshot: eaProcedure
    .input(accountSnapshotSchema)
    .mutation(async ({ ctx, input }) => {
      const { tradingAccount } = ctx;

      const snapshot = await prisma.accountSnapshot.create({
        data: {
          tradingAccountId: tradingAccount.id,
          balance: input.balance,
          equity: input.equity,
          margin: input.margin,
          freeMargin: input.freeMargin,
          marginLevel: input.marginLevel,
          profit: input.profit,
          credit: input.credit,
          leverage: input.leverage,
          serverName: input.serverName,
        },
      });

      // Update last sync time
      await prisma.tradingAccount.update({
        where: { id: tradingAccount.id },
        data: { lastSync: new Date() },
      });

      return { success: true, snapshotId: snapshot.id };
    }),

  // Sync all open positions (replaces all current positions)
  syncPositions: eaProcedure
    .input(z.object({ positions: z.array(positionSchema) }))
    .mutation(async ({ ctx, input }) => {
      const { tradingAccount } = ctx;

      // Start a transaction to replace all positions
      await prisma.$transaction(async (tx) => {
        // Delete all existing positions
        await tx.position.deleteMany({
          where: { tradingAccountId: tradingAccount.id },
        });

        // Create new positions
        if (input.positions.length > 0) {
          await tx.position.createMany({
            data: input.positions.map((pos) => ({
              tradingAccountId: tradingAccount.id,
              ticket: pos.ticket,
              symbol: pos.symbol,
              type: pos.type,
              volume: pos.volume,
              openPrice: pos.openPrice,
              currentPrice: pos.currentPrice,
              stopLoss: pos.stopLoss,
              takeProfit: pos.takeProfit,
              profit: pos.profit,
              swap: pos.swap,
              commission: pos.commission,
              openTime: new Date(pos.openTime),
              comment: pos.comment,
              magicNumber: pos.magicNumber,
            })),
          });
        }
      });

      return { success: true, positionsCount: input.positions.length };
    }),

  // Update a single position (for real-time updates)
  updatePosition: eaProcedure
    .input(positionSchema)
    .mutation(async ({ ctx, input }) => {
      const { tradingAccount } = ctx;

      const position = await prisma.position.upsert({
        where: {
          tradingAccountId_ticket: {
            tradingAccountId: tradingAccount.id,
            ticket: input.ticket,
          },
        },
        update: {
          currentPrice: input.currentPrice,
          profit: input.profit,
          swap: input.swap,
          commission: input.commission,
          stopLoss: input.stopLoss,
          takeProfit: input.takeProfit,
        },
        create: {
          tradingAccountId: tradingAccount.id,
          ticket: input.ticket,
          symbol: input.symbol,
          type: input.type,
          volume: input.volume,
          openPrice: input.openPrice,
          currentPrice: input.currentPrice,
          stopLoss: input.stopLoss,
          takeProfit: input.takeProfit,
          profit: input.profit,
          swap: input.swap,
          commission: input.commission,
          openTime: new Date(input.openTime),
          comment: input.comment,
          magicNumber: input.magicNumber,
        },
      });

      return { success: true, positionId: position.id };
    }),

  // Close position (move to history)
  closePosition: eaProcedure
    .input(tradeHistorySchema)
    .mutation(async ({ ctx, input }) => {
      const { tradingAccount } = ctx;

      await prisma.$transaction(async (tx) => {
        // Remove from open positions
        await tx.position.deleteMany({
          where: {
            tradingAccountId: tradingAccount.id,
            ticket: input.ticket,
          },
        });

        // Add to history (check if not already exists)
        await tx.tradeHistory.upsert({
          where: {
            tradingAccountId_ticket: {
              tradingAccountId: tradingAccount.id,
              ticket: input.ticket,
            },
          },
          update: {
            closePrice: input.closePrice,
            profit: input.profit,
            swap: input.swap,
            commission: input.commission,
            closeTime: new Date(input.closeTime),
          },
          create: {
            tradingAccountId: tradingAccount.id,
            ticket: input.ticket,
            symbol: input.symbol,
            type: input.type,
            volume: input.volume,
            openPrice: input.openPrice,
            closePrice: input.closePrice,
            stopLoss: input.stopLoss,
            takeProfit: input.takeProfit,
            profit: input.profit,
            swap: input.swap,
            commission: input.commission,
            openTime: new Date(input.openTime),
            closeTime: new Date(input.closeTime),
            comment: input.comment,
            magicNumber: input.magicNumber,
          },
        });
      });

      return { success: true };
    }),

  // Bulk sync history (for initial sync)
  syncHistory: eaProcedure
    .input(
      z.object({
        trades: z.array(tradeHistorySchema),
        replaceAll: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { tradingAccount } = ctx;

      await prisma.$transaction(async (tx) => {
        // Optionally clear existing history
        if (input.replaceAll) {
          await tx.tradeHistory.deleteMany({
            where: { tradingAccountId: tradingAccount.id },
          });
        }

        // Insert trades one by one (to handle duplicates)
        for (const trade of input.trades) {
          await tx.tradeHistory.upsert({
            where: {
              tradingAccountId_ticket: {
                tradingAccountId: tradingAccount.id,
                ticket: trade.ticket,
              },
            },
            update: {},
            create: {
              tradingAccountId: tradingAccount.id,
              ticket: trade.ticket,
              symbol: trade.symbol,
              type: trade.type,
              volume: trade.volume,
              openPrice: trade.openPrice,
              closePrice: trade.closePrice,
              stopLoss: trade.stopLoss,
              takeProfit: trade.takeProfit,
              profit: trade.profit,
              swap: trade.swap,
              commission: trade.commission,
              openTime: new Date(trade.openTime),
              closeTime: new Date(trade.closeTime),
              comment: trade.comment,
              magicNumber: trade.magicNumber,
            },
          });
        }
      });

      return { success: true, tradesCount: input.trades.length };
    }),
});

export type EARouter = typeof eaRouter;

