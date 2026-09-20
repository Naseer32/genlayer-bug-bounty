import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
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
          });
        }
      }
      return out;
    } catch (error) {
      console.error("Error fetching bounties:", error);
      throw new Error("Failed to fetch bounties from contract");
    }
  }

  async createBounty(repoUrl: string, issueId: string, amount: number): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_bounty",
        args: [repoUrl, issueId, BigInt(amount)],
        value: BigInt(0),
      });
      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });
      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error creating bounty:", error);
      throw new Error("Failed to create bounty");
    }
  }
}

export default BugBounty;
