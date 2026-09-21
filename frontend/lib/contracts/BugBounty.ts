import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { parseEther } from "viem";
import type { Bounty, TransactionReceipt } from "./types";

// Works for both Map and plain-object results
function entriesOf(v: any): [string, any][] {
  if (!v) return [];
  if (v instanceof Map) return Array.from(v.entries()) as [string, any][];
  return Object.entries(v);
}

class BugBounty {
  private contractAddress: `0x${string}`;
  private client: any;
  private studioUrl?: string;

  constructor(contractAddress: string, address?: string | null, studioUrl?: string) {
    this.contractAddress = contractAddress as `0x${string}`;
    this.studioUrl = studioUrl;
    this.client = this.makeClient(address);
  }

  private makeClient(address?: string | null) {
    const config: any = { chain: studionet };
    if (address) config.account = address as `0x${string}`;
    if (this.studioUrl) config.endpoint = this.studioUrl;
    return createClient(config);
  }

  updateAccount(address: string): void {
    this.client = this.makeClient(address);
  }

  async getBounties(): Promise<Bounty[]> {
    try {
      const data: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_bounties",
        args: [],
      });
      const out: Bounty[] = [];
      for (const [, byId] of entriesOf(data)) {
        for (const [id, raw] of entriesOf(byId)) {
          const b: Record<string, any> = Object.fromEntries(entriesOf(raw));
          out.push({
            id,
            creator: String(b.creator ?? ""),
            repo_url: String(b.repo_url ?? ""),
            issue_id: String(b.issue_id ?? ""),
            amount: String(b.amount ?? "0"),
            status: String(b.status ?? ""),
            pr_url: String(b.pr_url ?? ""),
            severity: String(b.severity ?? ""),
            resolved_to: String(b.resolved_to ?? ""),
            payout_amount: String(b.payout_amount ?? "0"),
            repo: String(b.repo ?? ""),
          });
        }
      }
      return out;
    } catch (error) {
      console.error("Error fetching bounties:", error);
      throw new Error("Failed to fetch bounties from contract");
    }
  }

  private waitFor(txHash: any, retries: number) {
    return this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "ACCEPTED" as any,
      retries,
      interval: 5000,
    });
  }

  // Escrows real GEN: amountGen is a decimal string such as "0.5"
  async createBounty(
    repoUrl: string,
    issueNumber: string,
    amountGen: string
  ): Promise<TransactionReceipt> {
    try {
      const before = (await this.getBounties()).length;
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_bounty",
        args: [repoUrl, issueNumber],
        value: parseEther(amountGen),
      });
      const receipt = await this.waitFor(txHash, 24);
      const after = (await this.getBounties()).length;
      if (after <= before) {
        throw new Error(
          "The contract rejected the bounty. Check the repo URL, the issue number and your GEN balance."
        );
      }
      return receipt as TransactionReceipt;
    } catch (error) {
      const msg = (error as any)?.shortMessage || (error as any)?.message || String(error);
      throw new Error(msg.slice(0, 300));
    }
  }

  // Only the bounty creator can resolve; the payout wallet is read from the PR
  async resolveBounty(
    creator: string,
    bountyId: string,
    prUrl: string
  ): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "resolve_bounty",
        args: [bountyId, prUrl],
        value: BigInt(0),
      });
      const receipt = await this.waitFor(txHash, 60);
      const all = await this.getBounties();
      const after = all.find(
        (b) => b.id === bountyId && b.creator.toLowerCase() === creator.toLowerCase()
      );
      if (!after || after.status !== "resolved") {
        throw new Error(
          "The contract did not resolve this bounty. The PR must be in the bounty's repo, be merged, say 'Fixes #<issue number>', and contain 'Payout: 0x...'."
        );
      }
      return receipt as TransactionReceipt;
    } catch (error) {
      const msg = (error as any)?.shortMessage || (error as any)?.message || String(error);
      throw new Error(msg.slice(0, 300));
    }
  }
}

export default BugBounty;
