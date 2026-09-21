"use client";

import { useState } from "react";
import { useCreateBounty } from "@/lib/hooks/useBugBounty";

export function CreateBountyForm() {
  const { createBounty, isCreating } = useCreateBounty();
  const [repoUrl, setRepoUrl] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [amount, setAmount] = useState("");

  const valid =
    repoUrl.trim().startsWith("https://github.com/") &&
    /^[0-9]+$/.test(issueNumber) &&
    Number(issueNumber) >= 1 &&
    /^[0-9]*\.?[0-9]+$/.test(amount) &&
    Number(amount) > 0;

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
          placeholder="Issue number (e.g. 1)"
          inputMode="numeric"
          value={issueNumber}
          onChange={(e) => setIssueNumber(e.target.value.replace(/[^0-9]/g, ""))}
        />
        <input
          className={inputClass}
          placeholder="Reward in GEN (e.g. 0.5)"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
        />
        <button
          disabled={!valid || isCreating}
          onClick={() =>
            createBounty(
              { repoUrl: repoUrl.trim(), issueNumber, amountGen: amount },
              {
                onSuccess: () => {
                  setRepoUrl("");
                  setIssueNumber("");
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
          Connect your wallet first. The GEN you enter is held in escrow by the contract until you resolve or cancel the bounty.
        </p>
      </div>
    </div>
  );
}
