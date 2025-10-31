import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../init";
import prisma from "@/lib/db";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";

// Validation schemas
const createTradingAccountSchema = z.object({
  accountNumber: z.string().min(1),
  broker: z.string().min(1),
  platform: z.enum(["MT4", "MT5"]),
  accountType: z.string().optional(),
  isMaster: z.boolean().default(false),
  isSlave: z.boolean().default(false),
});

const updateTradingAccountSchema = z.object({
  id: z.string(),
  accountType: z.string().optional(),
  isActive: z.boolean().optional(),
  isMaster: z.boolean().optional(),
  isSlave: z.boolean().optional(),
});

export const tradingAccountRouter = createTRPCRouter({
  // Get all trading accounts for the current user
  getMyAccounts: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx as { userId: string };

    return await prisma.tradingAccount.findMany({
      where: { userId },
      include: {
        snapshots: {
          orderBy: { timestamp: "desc" },
          take: 1, // Get only the latest snapshot
        },
        positions: {
          orderBy: { openTime: "desc" },
        },
        _count: {
          select: {
            tradesHistory: true,
            masterOf: true,
            slaveOf: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get a single trading account by ID
  getAccountById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
        include: {
          snapshots: {
            orderBy: { timestamp: "desc" },
            take: 10,
          },
          positions: {
            orderBy: { openTime: "desc" },
          },
          tradesHistory: {
            orderBy: { closeTime: "desc" },
            take: 50, // Get last 50 trades
          },
          masterOf: {
            include: {
              slaveAccount: true,
            },
          },
          slaveOf: {
            include: {
              masterAccount: true,
            },
          },
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      return account;
    }),

  // Create a new trading account
  createAccount: protectedProcedure
    .input(createTradingAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Check if account already exists
      const existing = await prisma.tradingAccount.findFirst({
        where: {
          userId,
          accountNumber: input.accountNumber,
          broker: input.broker,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This trading account is already registered",
        });
      }

      // Generate API key for EA authentication
      const apiKey = `ta_${randomBytes(32).toString("hex")}`;

      return await prisma.tradingAccount.create({
        data: {
          userId,
          accountNumber: input.accountNumber,
          broker: input.broker,
          platform: input.platform,
          accountType: input.accountType,
          isMaster: input.isMaster,
          isSlave: input.isSlave,
          apiKey,
        },
      });
    }),

  // Update trading account
  updateAccount: protectedProcedure
    .input(updateTradingAccountSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      const { id, ...updateData } = input;

      return await prisma.tradingAccount.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete trading account
  deleteAccount: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      return await prisma.tradingAccount.delete({
        where: { id: input.id },
      });
    }),

  // Regenerate API key (useful if compromised)
  regenerateApiKey: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      const newApiKey = `ta_${randomBytes(32).toString("hex")}`;

      return await prisma.tradingAccount.update({
        where: { id: input.id },
        data: { apiKey: newApiKey },
      });
    }),

  // Send heartbeat to notify EA that user is actively viewing
  sendHeartbeat: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx;

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      // Update lastSync to indicate user is actively viewing
      await prisma.tradingAccount.update({
        where: { id: input.id },
        data: { lastSync: new Date() },
      });

      return { success: true };
    }),

  // Get account statistics
  getAccountStats: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      // Get latest snapshot
      const latestSnapshot = await prisma.accountSnapshot.findFirst({
        where: { tradingAccountId: input.id },
        orderBy: { timestamp: "desc" },
      });

      // Get open positions count
      const openPositionsCount = await prisma.position.count({
        where: { tradingAccountId: input.id },
      });

      // Get total trades
      const totalTrades = await prisma.tradeHistory.count({
        where: { tradingAccountId: input.id },
      });

      // Get winning/losing trades
      const winningTrades = await prisma.tradeHistory.count({
        where: {
          tradingAccountId: input.id,
          profit: { gt: 0 },
        },
      });

      const losingTrades = await prisma.tradeHistory.count({
        where: {
          tradingAccountId: input.id,
          profit: { lt: 0 },
        },
      });

      // Calculate total profit/loss
      const profitLossResult = await prisma.tradeHistory.aggregate({
        where: { tradingAccountId: input.id },
        _sum: {
          profit: true,
          swap: true,
          commission: true,
        },
      });

      const totalProfit = profitLossResult._sum.profit || 0;
      const totalSwap = profitLossResult._sum.swap || 0;
      const totalCommission = profitLossResult._sum.commission || 0;

      return {
        latestSnapshot,
        openPositionsCount,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate:
          totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        totalProfit,
        totalSwap,
        totalCommission,
        netProfit: totalProfit + totalSwap + totalCommission,
      };
    }),
});


