import { baseProcedure, createTRPCRouter } from "../init";
import prisma from "@/lib/db";
import { tradingAccountRouter } from "./trading-account";
import { copyTradingRouter } from "./copy-trading";

export const appRouter = createTRPCRouter({
  // Legacy endpoint
  getUsers: baseProcedure.query(() => {
    return prisma.user.findMany();
  }),
  
  // Trading account management
  tradingAccount: tradingAccountRouter,
  
  // Copy trading management
  copyTrading: copyTradingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
