"use client";

import { useState } from "react";
import { useCreateBounty } from "@/lib/hooks/useBugBounty";

export function CreateBountyForm() {
  const { createBounty, isCreating } = useCreateBounty();
  const [repoUrl, setRepoUrl] = useState("");
  const [issueId, setIssueId] = useState("");
  const [amount, setAmount] = useState("");

  const valid =
    repoUrl.startsWith("http") && issueId.trim().length > 0 && Number(amount) > 0;

  const inputClass =
    "w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm";

  return (
    <div className="glass-card p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-4">Create a Bounty</h2>
      <div className="space-y-3">
        <input
          className={inputClass}
          placeholder="Repo URL (https://github.com/owner/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Issue ID (e.g. issue-42)"
          value={issueId}
          onChange={(e) => setIssueId(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Amount (whole number)"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        />
        <button
          disabled={!valid || isCreating}
          onClick={() =>
            createBounty(
              { repoUrl: repoUrl.trim(), issueId: issueId.trim(), amount: Number(amount) },
              {
                onSuccess: () => {
                  setRepoUrl("");
                  setIssueId("");
                  setAmount("");
                },
              }
            )
          }
          className="w-full rounded-md bg-accent px-4 py-2 font-bold text-black disabled:opacity-50"
        >
          {isCreating ? "Creating..." : "Create Bounty"}
        </button>
        <p className="text-xs text-muted-foreground">
          Connect your wallet first. This version records the amount but does not move real funds yet.
        </p>
      </div>
    </div>
  );
}
