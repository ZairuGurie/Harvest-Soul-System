import { ensureAuthSchema } from "./setup-auth-schema.mjs";

ensureAuthSchema().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
