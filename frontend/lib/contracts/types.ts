/**
 * TypeScript types for GenLayer Football Betting contract
 */

export interface Bet {
  id: string;
  game_date: string;
  team1: string;
  team2: string;
  predicted_winner: string;
  has_resolved: boolean;
  real_winner?: string;
  real_score?: string;
  resolution_url?: string;
  owner: string;
}

export interface LeaderboardEntry {
  address: string;
  points: number;
}

export interface TransactionReceipt {
  status: string;
  hash: string;
  blockNumber?: number;
  [key: string]: any;
}

export interface BetFilters {
  resolved?: boolean;
  owner?: string;
}

export interface Bounty {
  id: string;
  creator: string;
  repo_url: string;
  issue_id: string;
  amount: string;
  status: string;
  pr_url: string;
  severity: string;
  resolved_to: string;
  payout_amount?: string;
  repo?: string;
}
