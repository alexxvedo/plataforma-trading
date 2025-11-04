import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import prisma from "@/lib/db";
import { TRPCError } from "@trpc/server";

export const expertAdvisorRouter = createTRPCRouter({
  // Get all EAs for a trading account
  getByAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the trading account belongs to the user
      const tradingAccount = await prisma.tradingAccount.findFirst({
        where: {
          id: input.accountId,
          userId,
        },
      });

      if (!tradingAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      return await prisma.expertAdvisor.findMany({
        where: {
          tradingAccountId: input.accountId,
        },
        include: {
          _count: {
            select: {
              positions: true,
              tradesHistory: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }),

  // Create a new EA
  create: protectedProcedure
    .input(
      z.object({
        accountId: z.string(),
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        magicNumber: z.number().int().min(0, "Magic number must be positive"),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the trading account belongs to the user
      const tradingAccount = await prisma.tradingAccount.findFirst({
        where: {
          id: input.accountId,
          userId,
        },
      });

      if (!tradingAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      // Check if magic number is already used in this account
      const existingEA = await prisma.expertAdvisor.findFirst({
        where: {
          tradingAccountId: input.accountId,
          magicNumber: input.magicNumber,
        },
      });

      if (existingEA) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Magic number already exists for this account",
        });
      }

      // Use transaction to create EA and associate existing trades/positions
      return await prisma.$transaction(async (tx) => {
        // Create the new Expert Advisor
        const newEA = await tx.expertAdvisor.create({
          data: {
            tradingAccountId: input.accountId,
            name: input.name,
            description: input.description,
            magicNumber: input.magicNumber,
            color: input.color,
          },
        });

        // Associate existing trades with the same magic number
        const updatedTrades = await tx.tradeHistory.updateMany({
          where: {
            tradingAccountId: input.accountId,
            magicNumber: input.magicNumber,
            expertAdvisorId: null, // Only update trades not already associated
          },
          data: {
            expertAdvisorId: newEA.id,
          },
        });

        // Associate existing positions with the same magic number
        const updatedPositions = await tx.position.updateMany({
          where: {
            tradingAccountId: input.accountId,
            magicNumber: input.magicNumber,
            expertAdvisorId: null, // Only update positions not already associated
          },
          data: {
            expertAdvisorId: newEA.id,
          },
        });

        // If there were existing trades, recalculate statistics
        if (updatedTrades.count > 0) {
          const trades = await tx.tradeHistory.findMany({
            where: {
              expertAdvisorId: newEA.id,
            },
          });

          // Calculate statistics
          const totalTrades = trades.length;
          const winningTrades = trades.filter(t => t.profit > 0).length;
          const losingTrades = trades.filter(t => t.profit < 0).length;
          const totalProfit = trades.reduce((sum, t) => sum + (t.profit > 0 ? t.profit + (t.commission || 0) + (t.swap || 0) : 0), 0);
          const totalLoss = trades.reduce((sum, t) => sum + (t.profit < 0 ? Math.abs(t.profit + (t.commission || 0) + (t.swap || 0)) : 0), 0);
          
          const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
          const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

          // Find max profit and max drawdown
          const profits = trades.map(t => t.profit);
          const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
          
          // Simple drawdown calculation
          let runningProfit = 0;
          let peak = 0;
          let maxDrawdown = 0;

          for (const trade of trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime())) {
            runningProfit += trade.profit;
            if (runningProfit > peak) {
              peak = runningProfit;
            }
            const drawdown = peak - runningProfit;
            if (drawdown > maxDrawdown) {
              maxDrawdown = drawdown;
            }
          }

          // Update EA with calculated statistics
          await tx.expertAdvisor.update({
            where: { id: newEA.id },
            data: {
              totalTrades,
              winningTrades,
              losingTrades,
              totalProfit,
              totalLoss,
              maxDrawdown,
              maxProfit,
              averageWin,
              averageLoss,
              lastTradeAt: trades.length > 0 ? trades[trades.length - 1].closeTime : null,
            },
          });
        }

        return {
          ...newEA,
          associatedTrades: updatedTrades.count,
          associatedPositions: updatedPositions.count,
        };
      });
    }),

  // Update an EA
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        description: z.string().optional(),
        magicNumber: z.number().int().min(0, "Magic number must be positive").optional(),
        color: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };
      const { id, ...updateData } = input;

      // Verify the EA belongs to the user
      const ea = await prisma.expertAdvisor.findFirst({
        where: {
          id,
          tradingAccount: {
            userId,
          },
        },
      });

      if (!ea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expert Advisor not found",
        });
      }

      // If updating magic number, check for conflicts
      if (updateData.magicNumber && updateData.magicNumber !== ea.magicNumber) {
        const existingEA = await prisma.expertAdvisor.findFirst({
          where: {
            tradingAccountId: ea.tradingAccountId,
            magicNumber: updateData.magicNumber,
            id: { not: id },
          },
        });

        if (existingEA) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Magic number already exists for this account",
          });
        }
      }

      return await prisma.expertAdvisor.update({
        where: { id },
        data: updateData,
      });
    }),

  // Delete an EA
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the EA belongs to the user
      const ea = await prisma.expertAdvisor.findFirst({
        where: {
          id: input.id,
          tradingAccount: {
            userId,
          },
        },
      });

      if (!ea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expert Advisor not found",
        });
      }

      return await prisma.expertAdvisor.delete({
        where: { id: input.id },
      });
    }),

  // Get EA by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the EA belongs to the user
      const ea = await prisma.expertAdvisor.findFirst({
        where: {
          id: input.id,
          tradingAccount: {
            userId,
          },
        },
        include: {
          tradesHistory: true,
          positions: true,
        },
      });

      if (!ea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expert Advisor not found",
        });
      }

      return ea;
    }),

  // Get EA statistics
  getStatistics: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the EA belongs to the user
      const ea = await prisma.expertAdvisor.findFirst({
        where: {
          id: input.id,
          tradingAccount: {
            userId,
          },
        },
        include: {
          positions: {
            select: {
              profit: true,
              volume: true,
              symbol: true,
              openTime: true,
            },
          },
          tradesHistory: {
            select: {
              profit: true,
              volume: true,
              symbol: true,
              openTime: true,
              closeTime: true,
              commission: true,
              swap: true
            },
            orderBy: {
              closeTime: "desc",
            },
          },
        },
      });

      if (!ea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expert Advisor not found",
        });
      }

      // Calculate statistics
      const trades = ea.tradesHistory;
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.profit > 0).length;
      const losingTrades = trades.filter(t => t.profit < 0).length;
      const totalProfit = trades.reduce((sum, t) => sum + (t.profit > 0 ? (t.profit + (t.commission || 0) + (t.swap || 0)) : 0), 0);
      const totalLoss = trades.reduce((sum, t) => sum + (t.profit < 0 ? Math.abs(t.profit + (t.commission || 0) + (t.swap || 0)) : 0), 0);
      const netProfit = trades.reduce((sum, t) => sum + t.profit, 0);
      
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
      const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;
      const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;

      // Calculate drawdown (simplified)
      let runningProfit = 0;
      let maxProfit = 0;
      let maxDrawdown = 0;

      for (const trade of trades) {
        runningProfit += trade.profit;
        if (runningProfit > maxProfit) {
          maxProfit = runningProfit;
        }
        const drawdown = maxProfit - runningProfit;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      return {
        ea: {
          id: ea.id,
          name: ea.name,
          description: ea.description,
          magicNumber: ea.magicNumber,
          color: ea.color,
          isActive: ea.isActive,
        },
        statistics: {
          totalTrades,
          winningTrades,
          losingTrades,
          winRate: Math.round(winRate * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          totalLoss: Math.round(totalLoss * 100) / 100,
          netProfit: Math.round(netProfit * 100) / 100,
          averageWin: Math.round(averageWin * 100) / 100,
          averageLoss: Math.round(averageLoss * 100) / 100,
          profitFactor: Math.round(profitFactor * 100) / 100,
          maxDrawdown: Math.round(maxDrawdown * 100) / 100,
          currentPositions: ea.positions.length,
        },
        recentTrades: trades.slice(0, 10), // Last 10 trades
      };
    }),

  // Recalculate EA statistics (useful after associating trades)
  recalculateStatistics: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify the EA belongs to the user
      const ea = await prisma.expertAdvisor.findFirst({
        where: {
          id: input.id,
          tradingAccount: {
            userId,
          },
        },
      });

      if (!ea) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Expert Advisor not found",
        });
      }

      // Get all trades for this EA
      const trades = await prisma.tradeHistory.findMany({
        where: {
          expertAdvisorId: input.id,
        },
      });

      // Calculate statistics
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => t.profit > 0).length;
      const losingTrades = trades.filter(t => t.profit < 0).length;
      const totalProfit = trades.reduce((sum, t) => sum + (t.profit > 0 ? t.profit : 0), 0);
      const totalLoss = trades.reduce((sum, t) => sum + (t.profit < 0 ? Math.abs(t.profit) : 0), 0);
      
      const averageWin = winningTrades > 0 ? totalProfit / winningTrades : 0;
      const averageLoss = losingTrades > 0 ? totalLoss / losingTrades : 0;

      // Find max profit and max drawdown
      const profits = trades.map(t => t.profit);
      const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
      
      // Simple drawdown calculation
      let runningProfit = 0;
      let peak = 0;
      let maxDrawdown = 0;

      for (const trade of trades.sort((a, b) => a.closeTime.getTime() - b.closeTime.getTime())) {
        runningProfit += trade.profit;
        if (runningProfit > peak) {
          peak = runningProfit;
        }
        const drawdown = peak - runningProfit;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      // Update EA with calculated statistics
      return await prisma.expertAdvisor.update({
        where: { id: input.id },
        data: {
          totalTrades,
          winningTrades,
          losingTrades,
          totalProfit,
          totalLoss,
          maxDrawdown,
          maxProfit,
          averageWin,
          averageLoss,
          lastTradeAt: trades.length > 0 ? trades[trades.length - 1].closeTime : null,
        },
      });
    }),
});