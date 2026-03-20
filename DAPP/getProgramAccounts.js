import {
  Connection,
  PublicKey,
  clusterApiUrl,
  type GetProgramAccountsConfig,
} from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

let programId = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

let config: GetProgramAccountsConfig = {

  commitment: "finalized",

  encoding: "base64",

  filters: [
    {
      dataSize: 165,
    },
    {
      memcmp: {
        bytes: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
        offset: 0,
      },
    },
    {
      memcmp: {
        bytes: "5wx11hXBHQALycTQNkeQ5w1N9vgup4ardN2yLiDK4JyK",
        offset: 32,
      },
    },
  ],

  sortResults: true,
};

let accounts = await connection.getProgramAccounts(programId, config);

console.log(accounts);
