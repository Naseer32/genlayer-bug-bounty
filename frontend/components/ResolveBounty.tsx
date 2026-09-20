"use client";

import { useState } from "react";
import { useResolveBounty } from "@/lib/hooks/useBugBounty";
import { useWallet } from "@/lib/genlayer/wallet";
import type { Bounty } from "@/lib/contracts/types";

export function ResolveBounty({ bounty }: { bounty: Bounty }) {
  const { address } = useWallet();
  const { resolveBounty, isResolving } = useResolveBounty();
  const [open, setOpen] = useState(false);
  const [prUrl, setPrUrl] = useState("");
  const [contributor, setContributor] = useState("");

  const who = (contributor.trim() || address || "") as string;
  const valid = prUrl.startsWith("http") && /^0x[0-9a-fA-F]{40}$/.test(who);

  const inputClass =
    "w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-foreground";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-2 text-accent text-sm hover:underline">
        Resolve this bounty
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        className={inputClass}
        placeholder="Merged pull request URL (https://github.com/owner/repo/pull/123)"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
      />
      <input
        className={inputClass}
        placeholder={address ? "Contributor address (default: yours)" : "Contributor address (0x...)"}
        value={contributor}
        onChange={(e) => setContributor(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          disabled={!valid || isResolving}
          onClick={() =>
            resolveBounty({
              creator: bounty.creator,
              bountyId: bounty.id,
              prUrl: prUrl.trim(),
              contributor: who,
            })
          }
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {isResolving ? "AI is judging... (can take a few minutes)" : "Resolve"}
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
