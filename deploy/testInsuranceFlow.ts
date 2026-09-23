import { GenLayerClient, TransactionHash, TransactionStatus } from "genlayer-js/types";

const CONTRACT = "0x083041CAE1959B912eA3af5e336659E26CB38207";

function safeStringify(obj: any) {
  return JSON.stringify(
    obj,
    (_key, value) => (typeof value === "bigint" ? value.toString() : value),
    2
  );
}

export default async function main(client: GenLayerClient<any>) {
  const txHash = await client.writeContract({
    address: CONTRACT as `0x${string}`,
    functionName: "create_policy_pool",
    args: [
      "Flight Delay Cover",
      "Covers flight delays of 3+ hours. Requires a boarding pass and an airline/FlightAware screenshot showing 3+ hours delay for that flight.",
      "50000000000000000",
      "300000000000000000",
    ],
    value: 500000000000000000n,
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: txHash as TransactionHash,
    status: TransactionStatus.ACCEPTED,
    retries: 200,
  });

  console.log("FULL RECEIPT:", safeStringify(receipt));
}
