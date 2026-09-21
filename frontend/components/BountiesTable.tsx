"use client";

import { formatEther } from "viem";
import { useBounties } from "@/lib/hooks/useBugBounty";
import { useWallet } from "@/lib/genlayer/wallet";
import type { Bounty } from "@/lib/contracts/types";
import { ResolveBounty } from "./ResolveBounty";

function short(a: string) {
  return a && a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
}

function gen(wei: string) {
  try {
    return formatEther(BigInt(wei));
  } catch {
    return wei;
  }
}

function statusClass(status: string) {
  if (status === "resolved") return "bg-green-500/20 text-green-400";
  if (status === "cancelled") return "bg-gray-500/20 text-gray-400";
  return "bg-yellow-500/20 text-yellow-400";
}

export function BountiesTable() {
  const { data, isLoading, error, refetch, isFetching } = useBounties();
  const { address } = useWallet();

  const isCreator = (b: Bounty) =>
    !!address && address.toLowerCase() === b.creator.toLowerCase();

  return (
    <div className="glass-card p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Bounties</h2>
        <button onClick={() => refetch()} className="text-sm text-accent hover:underline">
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading bounties...</p>}
      {error && <p className="text-red-400">Could not load bounties: {error.message}</p>}
      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <p className="text-muted-foreground">No bounties yet. Create the first one!</p>
      )}

      <div className="space-y-3">
        {data?.map((b) => (
          <div key={`${b.creator}-${b.id}`} className="rounded-lg border border-white/10 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-bold">{b.id}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusClass(b.status)}`}>
                {b.status}
              </span>
            </div>
            <div className="text-sm text-muted-foreground space-y-1 break-all">
              <div>
                Repo:{" "}
                <a href={b.repo_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  {b.repo_url}
                </a>
              </div>
              <div>
                Issue: #{b.issue_id} · Escrow: {gen(b.amount)} GEN
              </div>
              <div>Creator: {short(b.creator)}</div>
              {b.severity && (
                <div>
                  Severity: <span className="text-foreground font-bold">{b.severity}</span>
                </div>
              )}
              {b.pr_url && (
                <div>
                  PR:{" "}
                  <a href={b.pr_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                    {b.pr_url}
                  </a>
                </div>
              )}
              {b.resolved_to && (
                <div>
                  Paid {gen(b.payout_amount ?? "0")} GEN to {short(b.resolved_to)}
                </div>
              )}
              {b.status === "open" && isCreator(b) && <ResolveBounty bounty={b} />}
              {b.status === "open" && !isCreator(b) && (
                <div className="text-xs">Only the creator can resolve this bounty.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
