# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


# Payout percentage by severity tier, in basis points of the escrowed amount.
SEVERITY_PAYOUT_BPS = {
    "critical": 10000,  # 100%
    "high": 7000,       # 70%
    "medium": 4000,      # 40%
    "low": 2000,         # 20%
}

STATUS_OPEN = "open"
STATUS_RESOLVED = "resolved"
STATUS_CANCELLED = "cancelled"


@allow_storage
@dataclass
class Bounty:
    id: str
    creator: str        # hex address string, not Address — mirrors Bet's all-str fields
    repo_url: str
    issue_id: str
    amount: str          # stored as str(int) — u256 inside a dataclass is unconfirmed
    status: str
    pr_url: str
    severity: str
    resolved_to: str    # hex address, "" if unresolved


class BugBounty(gl.Contract):
    # keyed by creator address, then bounty id — mirrors the bets/{addr}/{id}
    # shape used in the football-bets reference contract
    bounties: TreeMap[Address, TreeMap[str, Bounty]]
    next_bounty_seq: u256

    def __init__(self):
        pass

    def _check_pr(self, pr_url: str) -> dict:
        """
        Fetch the PR, ask the LLM whether it's merged and how severe the bug
        it fixes is, and require all validators to agree byte-for-byte
        (mirrors FootballBets._check_match).
        """

        def get_pr_result() -> str:
            web_data = gl.nondet.web.render(pr_url, mode="text")

            task = f"""
Extract the review outcome of this GitHub pull request.

PR content:
{web_data}

Respond in JSON:
{{
    "merged": bool,     // true only if the PR has actually been merged
    "severity": str     // one of "critical", "high", "medium", "low";
                         // if the PR is merged you MUST pick the closest tier ("moderate" means "medium"), never empty; "" only if the PR is not merged
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
""".strip()

            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(get_pr_result))

    @gl.public.write
    def create_bounty(self, repo_url: str, issue_id: str, amount: int) -> str:
        """
        Escrow a bounty against a repo/issue.

        NOTE: real fund custody (attaching value with the tx, e.g. via
        `gl.message.value` + a `.payable` write, and later `gl.transfer`)
        is unconfirmed against the actual SDK — see README. `amount` is
        taken as a plain argument here as a placeholder until that's
        verified; swap in the real payable/value flow once confirmed.
        """
        sender_address = gl.message.sender_address

        bounty_id = f"{issue_id}_{int(self.next_bounty_seq)}"
        self.next_bounty_seq = u256(int(self.next_bounty_seq) + 1)

        if sender_address in self.bounties and bounty_id in self.bounties[sender_address]:
            raise Exception("Bounty already created")

        bounty = Bounty(
            id=bounty_id,
            creator=sender_address.as_hex,
            repo_url=repo_url,
            issue_id=issue_id,
            amount=str(amount),
            status=STATUS_OPEN,
            pr_url="",
            severity="",
            resolved_to="",
        )
        self.bounties.get_or_insert_default(sender_address)[bounty_id] = bounty
        return bounty_id

    @gl.public.write
    def resolve_bounty(
        self, creator: Address, bounty_id: str, pr_url: str, contributor: Address
    ) -> None:
        bounty = self.bounties[creator][bounty_id]

        if bounty.status != STATUS_OPEN:
            raise Exception("Bounty is not open")

        pr_status = self._check_pr(pr_url)

        if not pr_status["merged"]:
            raise Exception("PR does not appear to be merged")

        severity = str(pr_status["severity"]).strip().lower()
        if severity == "moderate":
            severity = "medium"
        if severity not in SEVERITY_PAYOUT_BPS:
            raise Exception("Unrecognized severity tier")

        bounty.status = STATUS_RESOLVED
        bounty.pr_url = pr_url
        bounty.severity = severity
        bounty.resolved_to = contributor.as_hex

        # payout_bps / payout_amount kept for when fund transfer is wired up:
        # payout_bps = SEVERITY_PAYOUT_BPS[severity]
        # payout_amount = (int(bounty.amount) * payout_bps) // 10000
        # gl.transfer(Address(contributor), u256(payout_amount))
        # remainder = int(bounty.amount) - payout_amount
        # if remainder > 0:
        #     gl.transfer(creator_address, u256(remainder))

    @gl.public.write
    def cancel_bounty(self, bounty_id: str) -> None:
        sender_address = gl.message.sender_address
        bounty = self.bounties[sender_address][bounty_id]

        if bounty.status != STATUS_OPEN:
            raise Exception("Bounty is not open")

        bounty.status = STATUS_CANCELLED
        # gl.transfer(sender_address, u256(int(bounty.amount)))  # once transfer is confirmed

    @gl.public.view
    def get_bounties(self) -> dict:
        return {k.as_hex: v for k, v in self.bounties.items()}

    @gl.public.view
    def get_bounty(self, creator: Address, bounty_id: str) -> Bounty:
        return self.bounties[creator][bounty_id]
