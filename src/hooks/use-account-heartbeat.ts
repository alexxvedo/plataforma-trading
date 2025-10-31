"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * Hook to send heartbeat to a single trading account EA
 * This notifies the EA that user is actively viewing the account
 * EA will send real-time updates while heartbeats are received
 */
export function useAccountHeartbeat(accountId: string | undefined | null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trpc = useTRPC();
  const sendHeartbeat = useMutation({
    ...trpc.tradingAccount.sendHeartbeat.mutationOptions(),
  });

  const sendHeartbeatFn = useCallback(() => {
    if (accountId) {
      sendHeartbeat.mutate({ id: accountId });
    }
  }, [accountId, sendHeartbeat]);

  useEffect(() => {
    if (!accountId) {
      // Clear interval if no account
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat immediately
    sendHeartbeatFn();

    // Send heartbeat every 30 seconds
    intervalRef.current = setInterval(sendHeartbeatFn, 30000); // 30 seconds

    // Cleanup on unmount or accountId change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accountId, sendHeartbeatFn]);

  return null;
}

/**
 * Hook to send heartbeat to ALL user's trading accounts
 * Use this in the dashboard layout to keep all EAs in real-time mode
 * while user is anywhere in the application
 */
export function useAllAccountsHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trpc = useTRPC();
  const { data: accounts } = useQuery({
    ...trpc.tradingAccount.getMyAccounts.queryOptions(),
  });
  const sendHeartbeat = useMutation({
    ...trpc.tradingAccount.sendHeartbeat.mutationOptions(),
  });

  const sendHeartbeatToAll = useCallback(() => {
    if (accounts && accounts.length > 0) {
      accounts.forEach((account: { id: string }) => {
        sendHeartbeat.mutate({ id: account.id });
      });
    }
  }, [accounts, sendHeartbeat]);

  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      // Clear interval if no accounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Send initial heartbeat immediately
    sendHeartbeatToAll();

    // Send heartbeat to all accounts every 30 seconds
    intervalRef.current = setInterval(sendHeartbeatToAll, 30000); // 30 seconds

    // Cleanup on unmount or accounts change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accounts, sendHeartbeatToAll]);

  return null;
}

