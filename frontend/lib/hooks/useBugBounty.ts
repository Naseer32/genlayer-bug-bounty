"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import BugBounty from "../contracts/BugBounty";
import { getContractAddress, getStudioUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { Bounty } from "../contracts/types";

export function useBugBountyContract(): BugBounty | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();
  const studioUrl = getStudioUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS.",
        {
          label: "Setup Guide",
          onClick: () => window.open("/docs/setup", "_blank"),
        }
      );
      return null;
    }
    return new BugBounty(contractAddress, address, studioUrl);
  }, [contractAddress, address, studioUrl]);

  return contract;
}

export function useBounties() {
  const contract = useBugBountyContract();

  return useQuery<Bounty[], Error>({
    queryKey: ["bounties"],
    queryFn: () => {
      if (!contract) return Promise.resolve([]);
      return contract.getBounties();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useCreateBounty() {
  const contract = useBugBountyContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      repoUrl,
      issueId,
      amount,
    }: {
      repoUrl: string;
      issueId: string;
      amount: number;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      setIsCreating(true);
      return contract.createBounty(repoUrl, issueId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      setIsCreating(false);
      success("Bounty created!", {
        description: "Your bounty has been recorded on GenLayer.",
      });
    },
    onError: (err: any) => {
      console.error("Error creating bounty:", err);
      setIsCreating(false);
      error("Failed to create bounty", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isCreating,
    createBounty: mutation.mutate,
    createBountyAsync: mutation.mutateAsync,
  };
}
