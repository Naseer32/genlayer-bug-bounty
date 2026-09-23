# BugBounty: AI-verified bug bounties with real escrow on GenLayer

> Built on the GenLayer project boilerplate. The contribution of this project is the Intelligent Contract `contracts/bug_bounty_v2.py`, its deploy script, and the web app in `frontend/`.

A maintainer creates a bounty for one issue of one GitHub repo and escrows real GEN. When a contributor's pull request is merged, GenLayer validators read the PR, an LLM judges how severe the fixed bug is, and the contract pays the contributor a share of the escrow by severity. The rest goes back to the maintainer.

- **Live app:** https://genlayer-bug-bounty-rzyh.vercel.app/
- **Network:** GenLayer Studio (studionet)
- **Contract (v2):** `0x99b94cDB64a812Be9080DD7C44D3D45cC339F461`
- **Explorer:** https://explorer-studio.genlayer.com/address/0x99b94cDB64a812Be9080DD7C44D3D45cC339F461
- **Contract file:** `contracts/bug_bounty_v2.py`
- **Live test transactions:**
  - Create bounty: `0x0b3177c27d9d306d8b2645eb0d7d5d7df204aa78fd1da2814d00bc1edeac7add`
  - Resolve bounty: `0xb5a12cd1b4560961b751c0acd79e78a1d925ec93d7fc36f2c1490e968bb5d061`
  - Payout to contributor (0.7 GEN): `0xf59a63b2a097eac4df17090d0a09a81f6545900ce7d4645750b3f72559f7abe9`
  - Remainder (0.30 GEN): `0xca4df13c17bbb515081d3154c1e45fbef32fa8686652b92c03cbb24766deda29`

## How it works

1. **`create_bounty(repo_url, issue_number)`** is `payable`. The GEN attached to the transaction is held in escrow by the contract. The bounty is registered against `owner/repo` and the issue number.
2. **`resolve_bounty(bounty_id, pr_url)`** can only be called by the bounty creator. The contract then enforces, in code:
   - the PR URL is inside the registered repository
   - the PR page says it fixes the registered issue (`Fixes #N`)
   - the PR page declares a payout wallet (`Payout: 0x...`)

   Every validator fetches the PR page itself. The LLM only judges two things: is the PR merged, and how severe is the fixed bug (`critical`, `high`, `medium`, `low`). Validators must return identical JSON (`strict_eq`) before anything changes.
3. **Payout:** the wallet declared in the merged PR receives a share of the escrow by severity (critical 100%, high 70%, medium 40%, low 20%) through `emit_transfer`. The remainder is refunded to the creator.
4. **`cancel_bounty(bounty_id)`** lets the creator cancel an open bounty and get the escrow back.
5. **`get_bounties()`** is a read-only view.

## Verified run (GenLayer Studio)

Demo repo: https://github.com/Naseer32/bounty-demo. Issue #1 reports a stored XSS. PR #3 fixes it, says `Fixes #1`, and declares a payout wallet.

A bounty of 0.5 GEN was created for that issue from a MetaMask wallet and resolved in the web app with PR #3:

```
id:        issue-1_0
status:    resolved
severity:  high
escrow:    0.5 GEN
paid:      0.35 GEN to 0x5f463B8CAC925dA573594E63adC1Bc3AA98229C8 (70%, high)
refunded:  0.15 GEN to the creator
```

To reproduce: open the app, connect a wallet with some GEN on GenLayer Studio, create a bounty for `https://github.com/Naseer32/bounty-demo` issue `1`, then resolve it with `https://github.com/Naseer32/bounty-demo/pull/3`.

## Notes for the GenVM SDK

- `@gl.public.write.payable` and `gl.message.value` receive GEN. Pay out with `emit_transfer` on an `@gl.evm.contract_interface` (same pattern as the Arbiter escrow contract).
- Addresses sent from a JS client and from the CLI arrive as `Address` objects, not strings. This contract avoids address arguments: the creator is `gl.message.sender_address`, and the recipient is read from the PR.
- Use `gl.eq_principle.strict_eq(fn)` for LLM consensus and `gl.nondet.web.render(url, mode="text")` to fetch a page.
- A contract exception still shows as `ACCEPTED` at the consensus level (validators agree it reverted). Always read state back to confirm it changed. The web app does this.
- The CLI has no option to attach GEN to a write, so escrowed bounties are created from the web app.

## Known limitations

- **The creator controls resolution.** Only the creator can resolve or cancel, so a creator could cancel and reclaim the escrow after a fix is merged. A production version should lock the escrow for a period or add a dispute step.
- **The payout wallet is read from the PR text.** Anyone who can edit the PR description can change it. Only merged PRs count, so the maintainer has reviewed it, but a stricter design would bind the wallet to the PR author.
- **Prompt injection.** The LLM reads the PR page. The prompt tells it to ignore instructions in the page, but that is not a guarantee.
- **Strict consensus.** `strict_eq` needs identical JSON from all validators. In testing, validators occasionally disagreed and the majority decided. `gl.eq_principle.prompt_comparative` would tolerate near-equivalent answers.
- **GitHub availability.** Validators load the public PR page, so private repos are not supported.

## Version 1

The first version (`contracts/bug_bounty.py`, address `0xaD495de36EA054f66e6a7fBF65aB2B36F24e76cF`) had no escrow and no access control. It is kept only for history.

## Live test results (GenLayer Studio)

The InsuranceClaimVerifier flow was tested end to end with real AI validator consensus:

| Step | Tx hash |
|---|---|
| Deploy | 0xee607c882ef64f0df5a124c384f13aff4a015c9cfcad2d11a5c63989c775623b |
| create_policy_pool | 0x4f32e6c454d1641a5907fc02ba2903d4a7516b24b28acbc865a900d3b6778ce0 |
| buy_policy | 0x3a48c38c3bce1369ff3584da0cb76f3854b384b5361f0b47c8f5e7c4bff7faf5 |
| submit_claim (claim_1) | 0xaafe35a76371e6e23ee3e5dccdf3a03f0ac85df76ea8d4e8d74c5f282d992b99 |
| resolve_claim (claim_1, DENIED) | 0x3d579569689e1e22b53db9a33c9b1467ecb86e41cc6305b83ffb596f6b79433c |
| submit_claim (claim_2) | 0x6accef44ccfbc0f46f5496f260f45219a1b0de15219dad6270d5b6ac8ca837ba |
| resolve_claim (claim_2, APPROVED, 3 GEN paid) | 0x6d2e5dfee0f71c7551b07499624e4bfcd45ef99cd47a1aa01318db6bd3f7d40b |

- claim_1: evidence showed general flooding in Pakistan but not damage at the insured property, so validators denied it.
- claim_2: evidence named the insured property directly, validators approved 100% and the pool paid out 3 GEN (pool balance 7 GEN to 4 GEN).
- Evidence for claim_2 is a test fixture (`evidence/nowshera_flood_report.txt`), not a real news article.
