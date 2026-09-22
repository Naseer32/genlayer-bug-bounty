# Resubmission: What changed since the last review

The v2 contract (`contracts/bug_bounty_v2.py`) has been redeployed and the frontend updated to fully address the three issues raised:

1. **PR evidence is now bound to the registered repo and issue.** `resolve_bounty` verifies the merged PR belongs to the bounty's own `owner/repo` and references the bounty's issue number (`Fixes #<issue>`) before any payout logic runs.
2. **Only the bounty creator can resolve it, and payout goes to a wallet declared in the merged PR** — not an arbitrary caller or an arbitrary recipient.
3. **The outcome is now consequential.** `create_bounty` is `payable`; the attached GEN is held in escrow by the contract. On a valid resolve, GEN is actually transferred (`emit_transfer`) to the contributor's wallet by severity tier, with the remainder returned to the creator.

**Live contract:** `0x99b94cDB64a812Be9080DD7C44D3D45cC339F461`
**Explorer:** https://explorer-studio.genlayer.com/address/0x99b94cDB64a812Be9080DD7C44D3D45cC339F461
**Live app:** https://genlayer-bug-bounty-rzyh.vercel.app/

**End-to-end proof, run on this exact contract:**
- Create bounty (1 GEN escrowed): `0x0b3177c27d9d306d8b2645eb0d7d5d7df204aa78fd1da2814d00bc1edeac7add`
- Resolve bounty (severity: high, merged PR https://github.com/Naseer32/bounty-demo/pull/3): `0xb5a12cd1b4560961b751c0acd79e78a1d925ec93d7fc36f2c1490e968bb5d061`
- Payout to contributor, 0.7 GEN: `0xf59a63b2a097eac4df17090d0a09a81f6545900ce7d4645750b3f72559f7abe9`
- Remainder to creator, 0.30 GEN: `0xca4df13c17bbb515081d3154c1e45fbef32fa8686652b92c03cbb24766deda29`
