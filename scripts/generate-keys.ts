import { generateKeyPair, exportJWK } from "jose";
import { randomUUID } from "crypto";

async function main() {
  const kid = `key-${randomUUID()}`;

  const { publicKey, privateKey } = await generateKeyPair("ES256", {
    extractable: true,
  });

  const privateJwk = await exportJWK(privateKey);
  const publicJwk = await exportJWK(publicKey);

  privateJwk.kid = kid;
  privateJwk.alg = "ES256";
  privateJwk.use = "sig";

  publicJwk.kid = kid;
  publicJwk.alg = "ES256";
  publicJwk.use = "sig";

  console.log("=".repeat(60));
  console.log("EUDI Wallet Event Credential Issuer - Key Generation");
  console.log("=".repeat(60));
  console.log();
  console.log("Algorithm : ES256 (P-256)");
  console.log("Key ID    :", kid);
  console.log();

  console.log("--- ISSUER_PRIVATE_JWK (keep secret) ---");
  console.log(JSON.stringify(privateJwk));
  console.log();

  console.log("--- ISSUER_PUBLIC_JWK ---");
  console.log(JSON.stringify(publicJwk));
  console.log();

  console.log("Add these to your .env.local or Vercel environment variables:");
  console.log();
  console.log(`ISSUER_PRIVATE_JWK='${JSON.stringify(privateJwk)}'`);
  console.log();
  console.log(`ISSUER_PUBLIC_JWK='${JSON.stringify(publicJwk)}'`);
  console.log();
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Key generation failed:", err);
  process.exit(1);
});
