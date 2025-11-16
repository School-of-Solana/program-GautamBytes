import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";

import { type AnchorProject } from "./idl"; 
import idl from "./idl.json";

export const PROGRAM_ID = new PublicKey(
  "Cc375VeukGtm6PawGFJ9ZU9ELwwNtbAHHAB7fxFSUySy"
);

export const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export const getProgram = (provider: AnchorProvider) => {
  return new Program<AnchorProject>(idl as any, PROGRAM_ID as any, provider as any);
};