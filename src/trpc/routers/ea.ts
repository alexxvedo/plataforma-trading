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

  // Check if there are active users viewing this account (heartbeat-based)
  checkActivity: eaProcedure.mutation(async ({ ctx }) => {
    const { tradingAccount } = ctx;
    
    // Check if there's a recent heartbeat (last 60 seconds)
    // Frontend sends heartbeat every 30s, so 60s gives buffer
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const account = await prisma.tradingAccount.findUnique({
      where: { id: tradingAccount.id },
      select: { lastSync: true },
    });
    
    // If lastSync is recent, it means frontend is actively sending heartbeats
    const isActive = account?.lastSync && account.lastSync > oneMinuteAgo;
    
    return {
      success: true,
      isActive: isActive || false,
      accountId: tradingAccount.id,
      lastHeartbeat: account?.lastSync?.toISOString(),
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

      // Calculate seconds since last heartbeat from frontend
      // lastSync is updated by frontend heartbeat (sendHeartbeat mutation)
      const lastHeartbeatSeconds = tradingAccount.lastSync 
        ? Math.floor((Date.now() - tradingAccount.lastSync.getTime()) / 1000)
        : 999999; // Very large number if never synced

      return { 
        success: true, 
        snapshotId: snapshot.id,
        lastHeartbeatSeconds, // EA usa esto para saber si hay usuario activo
      };
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

      // Calculate seconds since last heartbeat from frontend
      const lastHeartbeatSeconds = tradingAccount.lastSync
        ? Math.floor((Date.now() - tradingAccount.lastSync.getTime()) / 1000)
        : 999999;

      return { 
        success: true, 
        positionsCount: input.positions.length,
        lastHeartbeatSeconds,
      };
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

      // Calculate seconds since last heartbeat from frontend
      const lastHeartbeatSeconds = tradingAccount.lastSync
        ? Math.floor((Date.now() - tradingAccount.lastSync.getTime()) / 1000)
        : 999999;

      return { 
        success: true, 
        positionId: position.id,
        lastHeartbeatSeconds,
      };
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

