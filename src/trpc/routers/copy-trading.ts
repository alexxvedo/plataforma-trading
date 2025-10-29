import { z } from "zod";
import { protectedProcedure, createTRPCRouter } from "../init";
import prisma from "@/lib/db";
import { TRPCError } from "@trpc/server";

const createRelationSchema = z.object({
  masterAccountId: z.string(),
  slaveAccountId: z.string(),
  riskMultiplier: z.number().min(0.01).max(10).default(1.0),
  allowedSymbols: z.array(z.string()).default([]),
  maxLotSize: z.number().positive().optional(),
  minLotSize: z.number().positive().optional(),
});

const updateRelationSchema = z.object({
  id: z.string(),
  isActive: z.boolean().optional(),
  riskMultiplier: z.number().min(0.01).max(10).optional(),
  allowedSymbols: z.array(z.string()).optional(),
  maxLotSize: z.number().positive().optional(),
  minLotSize: z.number().positive().optional(),
});

export const copyTradingRouter = createTRPCRouter({
  // Get all copy trading relations for user's accounts
  getMyRelations: protectedProcedure.query(async ({ ctx }) => {
    const { userId } = ctx as { userId: string };

    // Get all user's trading accounts
    const userAccounts = await prisma.tradingAccount.findMany({
      where: { userId },
      select: { id: true },
    });

    const accountIds = userAccounts.map((a) => a.id);

    // Get relations where user is either master or slave
    return await prisma.copyTradingRelation.findMany({
      where: {
        OR: [
          { masterAccountId: { in: accountIds } },
          { slaveAccountId: { in: accountIds } },
        ],
      },
      include: {
        masterAccount: {
          select: {
            id: true,
            accountNumber: true,
            broker: true,
            platform: true,
            isActive: true,
          },
        },
        slaveAccount: {
          select: {
            id: true,
            accountNumber: true,
            broker: true,
            platform: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  // Get relations where an account is master
  getMasterRelations: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.accountId,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      return await prisma.copyTradingRelation.findMany({
        where: { masterAccountId: input.accountId },
        include: {
          slaveAccount: true,
        },
      });
    }),

  // Get relations where an account is slave
  getSlaveRelations: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership
      const account = await prisma.tradingAccount.findFirst({
        where: {
          id: input.accountId,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trading account not found",
        });
      }

      return await prisma.copyTradingRelation.findMany({
        where: { slaveAccountId: input.accountId },
        include: {
          masterAccount: true,
        },
      });
    }),

  // Create a copy trading relation
  createRelation: protectedProcedure
    .input(createRelationSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Verify ownership of both accounts
      const [masterAccount, slaveAccount] = await Promise.all([
        prisma.tradingAccount.findFirst({
          where: {
            id: input.masterAccountId,
            userId,
          },
        }),
        prisma.tradingAccount.findFirst({
          where: {
            id: input.slaveAccountId,
            userId,
          },
        }),
      ]);

      if (!masterAccount || !slaveAccount) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "One or both trading accounts not found",
        });
      }

      // Prevent self-copying
      if (input.masterAccountId === input.slaveAccountId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot copy trade to the same account",
        });
      }

      // Check if relation already exists
      const existing = await prisma.copyTradingRelation.findUnique({
        where: {
          masterAccountId_slaveAccountId: {
            masterAccountId: input.masterAccountId,
            slaveAccountId: input.slaveAccountId,
          },
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Copy trading relation already exists",
        });
      }

      // Update account flags
      await Promise.all([
        prisma.tradingAccount.update({
          where: { id: input.masterAccountId },
          data: { isMaster: true },
        }),
        prisma.tradingAccount.update({
          where: { id: input.slaveAccountId },
          data: { isSlave: true },
        }),
      ]);

      // Create relation
      return await prisma.copyTradingRelation.create({
        data: {
          masterAccountId: input.masterAccountId,
          slaveAccountId: input.slaveAccountId,
          riskMultiplier: input.riskMultiplier,
          allowedSymbols: input.allowedSymbols,
          maxLotSize: input.maxLotSize,
          minLotSize: input.minLotSize,
        },
        include: {
          masterAccount: true,
          slaveAccount: true,
        },
      });
    }),

  // Update a copy trading relation
  updateRelation: protectedProcedure
    .input(updateRelationSchema)
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Get relation and verify ownership
      const relation = await prisma.copyTradingRelation.findUnique({
        where: { id: input.id },
        include: {
          masterAccount: true,
          slaveAccount: true,
        },
      });

      if (!relation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Copy trading relation not found",
        });
      }

      // Verify user owns at least one of the accounts
      if (
        relation.masterAccount.userId !== userId &&
        relation.slaveAccount.userId !== userId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to modify this relation",
        });
      }

      const { id, ...updateData } = input;

      return await prisma.copyTradingRelation.update({
        where: { id },
        data: updateData,
        include: {
          masterAccount: true,
          slaveAccount: true,
        },
      });
    }),

  // Delete a copy trading relation
  deleteRelation: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx as { userId: string };

      // Get relation and verify ownership
      const relation = await prisma.copyTradingRelation.findUnique({
        where: { id: input.id },
        include: {
          masterAccount: true,
          slaveAccount: true,
        },
      });

      if (!relation) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Copy trading relation not found",
        });
      }

      // Verify user owns at least one of the accounts
      if (
        relation.masterAccount.userId !== userId &&
        relation.slaveAccount.userId !== userId
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this relation",
        });
      }

      await prisma.copyTradingRelation.delete({
        where: { id: input.id },
      });

      // Check if accounts still have other relations
      const [masterRelations, slaveRelations] = await Promise.all([
        prisma.copyTradingRelation.count({
          where: { masterAccountId: relation.masterAccountId },
        }),
        prisma.copyTradingRelation.count({
          where: { slaveAccountId: relation.slaveAccountId },
        }),
      ]);

      // Update flags if no more relations
      if (masterRelations === 0) {
        await prisma.tradingAccount.update({
          where: { id: relation.masterAccountId },
          data: { isMaster: false },
        });
      }

      if (slaveRelations === 0) {
        await prisma.tradingAccount.update({
          where: { id: relation.slaveAccountId },
          data: { isSlave: false },
        });
      }

      return { success: true };
    }),
});

