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

  // Memoize the heartbeat function to avoid recreating it on every render
  const doSendHeartbeat = useCallback(() => {
    if (!accountId) return;
    if (!sendHeartbeat.isPending) {
      sendHeartbeat.mutate({ id: accountId });
    }
  }, [accountId, sendHeartbeat]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!accountId) {
      return;
    }

    // Send initial heartbeat immediately
    doSendHeartbeat();

    // Send heartbeat every 30 seconds
    intervalRef.current = setInterval(doSendHeartbeat, 30000);

    // Cleanup on unmount or accountId change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [accountId, doSendHeartbeat]);

  return null;
}

/**
 * Hook to send heartbeat to ALL user's trading accounts
 * Use this in the dashboard layout to keep all EAs in real-time mode
 * while user is anywhere in the application
 */
export function useAllAccountsHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);
  const trpc = useTRPC();
  const { data: accounts } = useQuery({
    ...trpc.tradingAccount.getMyAccounts.queryOptions(),
  });
  const sendHeartbeat = useMutation({
    ...trpc.tradingAccount.sendHeartbeat.mutationOptions(),
  });

  // Function to send heartbeat to all accounts
  const doSendHeartbeatToAll = useCallback(async () => {
    // Only send heartbeat if page is visible (not in background tab)
    if (typeof document !== 'undefined' && document.hidden) {
      console.log("⏸️ Página en background - pausando heartbeats");
      return;
    }

    if (!accounts || accounts.length === 0) {
      return;
    }

    if (!sendHeartbeat.isPending) {
      console.log(`💓 Enviando heartbeat a ${accounts.length} cuenta(s)...`);
      
      // Send heartbeats sequentially to avoid batching issues
      for (const account of accounts) {
        try {
          await sendHeartbeat.mutateAsync({ id: account.id });
          console.log(`✓ Heartbeat enviado a cuenta ${account.id.substring(0, 8)}...`);
        } catch (err) {
          console.error(`✗ Error enviando heartbeat a ${account.id.substring(0, 8)}:`, err);
        }
      }
    }
  }, [accounts, sendHeartbeat]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // If accounts are loaded and we haven't initialized yet, send immediate heartbeat
    if (accounts && accounts.length > 0 && !hasInitializedRef.current) {
      console.log("🚀 Iniciando sistema de heartbeat...");
      hasInitializedRef.current = true;
      // Send initial heartbeat immediately when accounts are first loaded
      doSendHeartbeatToAll();
    }

    // Only set up interval if we have accounts
    if (accounts && accounts.length > 0) {
      // Send heartbeat to all accounts every 30 seconds
      intervalRef.current = setInterval(doSendHeartbeatToAll, 30000);
    }

    // Listen to visibility changes to pause/resume heartbeats
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("👁️ Página oculta - heartbeats se pausarán automáticamente");
      } else {
        console.log("👁️ Página visible - enviando heartbeat inmediato...");
        doSendHeartbeatToAll();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    // Cleanup on unmount or accounts change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [accounts, doSendHeartbeatToAll]);

  // Reset initialization flag when accounts change (e.g., user logs out/in)
  useEffect(() => {
    if (!accounts || accounts.length === 0) {
      hasInitializedRef.current = false;
    }
  }, [accounts]);

  return null;
}

