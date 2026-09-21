"use client";

import { useState } from "react";
import { useResolveBounty } from "@/lib/hooks/useBugBounty";
import type { Bounty } from "@/lib/contracts/types";

export function ResolveBounty({ bounty }: { bounty: Bounty }) {
  const { resolveBounty, isResolving } = useResolveBounty();
  const [open, setOpen] = useState(false);
  const [prUrl, setPrUrl] = useState("");

  const valid = prUrl.trim().startsWith("https://github.com/");

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
        placeholder="Merged pull request URL (https://github.com/owner/repo/pull/1)"
        value={prUrl}
        onChange={(e) => setPrUrl(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        The PR must be in {bounty.repo || bounty.repo_url}, be merged, say &quot;Fixes #{bounty.issue_id}&quot;,
        and contain &quot;Payout: 0x...&quot; with the contributor wallet.
      </p>
      <div className="flex gap-2">
        <button
          disabled={!valid || isResolving}
          onClick={() =>
            resolveBounty({
              creator: bounty.creator,
              bountyId: bounty.id,
              prUrl: prUrl.trim(),
            })
          }
          className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-50"
        >
          {isResolving ? "AI is judging... (can take a few minutes)" : "Resolve and pay"}
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-muted-foreground hover:underline">
          Cancel
        </button>
      </div>
    </div>
  );
}
