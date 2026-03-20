import {
  address,
  appendTransactionMessageInstructions,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  AccountRole,
  type Instruction,
  type Address,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";

// Jito block engine endpoint (mainnet)
const JITO_ENDPOINT = "https://mainnet.block-engine.jito.wtf/api/v1/transactions";

// Any valid pubkey starting with "jitodontfront". Does not need to exist on-chain.
// Mark as read-only for optimal landing speed.
const DONT_FRONT: Address = address(
  "jitodontfront111111111111111111111111111111"
);

// Jito tip accounts — pick one at random to reduce contention.
// Source: https://docs.jito.wtf/lowlatencytxnsend/#gettipaccounts
const TIP_ACCOUNTS: Address[] = [
  address("96gYZGLnJYVFmbjzopPSU6QiEV5fGqZNyN9nmNhvrZU5"),
  address("HFqU5x63VTqvQss8hp11i4wVV8bD44PvwucfZ2bU7gRe"),
  address("Cw8CFyM9FkoMi7K7Crf6HNQqf4uEMzpKw6QNghXLvLkY"),
  address("ADaUMid9yfUytqMBgopwjb2DTLSokTSzL1zt6iGPaS49"),
  address("DfXygSm4jCyNCybVYYK6DwvWqjKee8pbDmJGcLWNDXjh"),
  address("ADuUkR4vqLUMWXxW9gh6D6L8pMSawimctcNZ5pGwDcEt"),
  address("DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL"),
  address("3AVi9Tg9Uo68tJfuvoKvqKNWKkC5wPdSSdeBnizKZ6jT"),
];

// !mark(1:8)
// Append jitodontfront as a read-only account to any instruction.
// The block engine sees this prefix and ensures your tx is at bundle index 0.
function withDontFront(ix: Instruction): Instruction {
  return {
    ...ix,
    accounts: [
      ...(ix.accounts ?? []),
      { address: DONT_FRONT, role: AccountRole.READONLY },
    ],
  };
}

function randomTipAccount(): Address {
  return TIP_ACCOUNTS[Math.floor(Math.random() * TIP_ACCOUNTS.length)]!;
}

// Create an RPC for reads — sends go through Jito's endpoint
const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");
const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

const signer = await createKeyPairSignerFromBytes(/* your keypair bytes */);
const recipient = address("RecipientAddress111111111111111111111111111");

// Build a transfer with dontfront protection
// !mark
const transferIx = withDontFront(
  getTransferSolInstruction({
    source: signer,
    destination: recipient,
    amount: lamports(1_000_000n),
  })
);

// Jito tip — SOL transfer to a random tip account (min 1000 lamports)
const tipIx = getTransferSolInstruction({
  source: signer,
  destination: randomTipAccount(),
  amount: lamports(1_000n),
});

const transactionMessage = pipe(
  createTransactionMessage({ version: 0 }),
  (m) => setTransactionMessageFeePayerSigner(signer, m),
  (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
  (m) => appendTransactionMessageInstructions([transferIx, tipIx], m)
);

const signed = await signTransactionMessageWithSigners(transactionMessage);
const base64Tx = getBase64EncodedWireTransaction(signed);

// !mark(1:12)
// Send via Jito block engine (not standard RPC)
const response = await fetch(JITO_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "sendTransaction",
    params: [base64Tx, { encoding: "base64" }],
  }),
});
const { result: signature } = await response.json();
console.log(`Sent with dontfront protection: ${signature}`);
