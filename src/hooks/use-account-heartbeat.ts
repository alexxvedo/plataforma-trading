"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!accountId) {
      return;
    }

    // Function to send heartbeat
    const doSendHeartbeat = () => {
      if (!sendHeartbeat.isPending) {
        sendHeartbeat.mutate({ id: accountId });
      }
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]); // Only depend on accountId, not the mutation

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

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!accounts || accounts.length === 0) {
      return;
    }

    // Function to send heartbeat to all accounts
    const doSendHeartbeatToAll = () => {
      if (!sendHeartbeat.isPending && accounts && accounts.length > 0) {
        console.log(`💓 Enviando heartbeat a ${accounts.length} cuenta(s)...`);
        accounts.forEach((account: { id: string }) => {
          // Send each heartbeat individually (not batched)
          sendHeartbeat.mutate(
            { id: account.id },
            {
              onSuccess: () => {
                console.log(`✓ Heartbeat enviado a cuenta ${account.id.substring(0, 8)}...`);
              },
              onError: (err) => {
                console.error(`✗ Error enviando heartbeat:`, err);
              },
            }
          );
        });
      }
    };

    // Send initial heartbeat immediately
    console.log("🚀 Iniciando sistema de heartbeat...");
    doSendHeartbeatToAll();

    // Send heartbeat to all accounts every 30 seconds
    intervalRef.current = setInterval(doSendHeartbeatToAll, 30000);

    // Cleanup on unmount or accounts change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts?.length]); // Only depend on accounts length, not the mutation or accounts object

  return null;
}

