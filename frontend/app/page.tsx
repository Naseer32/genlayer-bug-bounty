"use client";

import { Navbar } from "@/components/Navbar";
import { BountiesTable } from "@/components/BountiesTable";
import { CreateBountyForm } from "@/components/CreateBountyForm";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Automated Bug Bounties
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              An AI-judged bug bounty on GenLayer. Validators read the pull request
              and agree on how severe the fixed bug is.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            <div className="lg:col-span-8">
              <BountiesTable />
            </div>
            <div className="lg:col-span-4">
              <CreateBountyForm />
            </div>
          </div>

          <div className="mt-8 glass-card p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">How it Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">1. Create a Bounty</div>
                <p className="text-sm text-muted-foreground">
                  Connect your wallet and post a bounty for an issue in a GitHub repo.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">2. Fix and Submit</div>
                <p className="text-sm text-muted-foreground">
                  A contributor fixes the bug and opens a pull request.
                </p>
              </div>
              <div className="space-y-2">
                <div className="text-accent font-bold text-lg">3. AI Decides</div>
                <p className="text-sm text-muted-foreground">
                  GenLayer validators read the PR, check it is merged, and agree on its severity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 py-2">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              Powered by GenLayer
            </a>
            <a href="https://github.com/Naseer32/genlayer-bug-bounty" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
