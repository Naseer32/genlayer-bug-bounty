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
        "Contract address not configured.",
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
      issueNumber,
      amountGen,
    }: {
      repoUrl: string;
      issueNumber: string;
      amountGen: string;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      setIsCreating(true);
      return contract.createBounty(repoUrl, issueNumber, amountGen);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      setIsCreating(false);
      success("Bounty created!", {
        description: "Your GEN is now held in escrow by the contract.",
      });
    },
    onError: (err: any) => {
      console.error("Error creating bounty:", err);
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
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

export function useResolveBounty() {
  const contract = useBugBountyContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isResolving, setIsResolving] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      creator,
      bountyId,
      prUrl,
    }: {
      creator: string;
      bountyId: string;
      prUrl: string;
    }) => {
      if (!contract) {
        throw new Error("Contract not configured.");
      }
      if (!address) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      setIsResolving(true);
      return contract.resolveBounty(creator, bountyId, prUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      setIsResolving(false);
      success("Bounty resolved!", {
        description: "The contributor was paid from the escrow.",
      });
    },
    onError: (err: any) => {
      console.error("Error resolving bounty:", err);
      queryClient.invalidateQueries({ queryKey: ["bounties"] });
      setIsResolving(false);
      error("Could not resolve bounty", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isResolving,
    resolveBounty: mutation.mutate,
  };
}
