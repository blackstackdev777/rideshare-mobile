import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";

// Execute the real auth configuration with controlled environment fixtures.
// Never load .env.local here or display any configuration value.
const require = createRequire(import.meta.url);
const source = ts.transpileModule(readFileSync("src/lib/auth.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
function load(env) {
  const resultModule = { exports: {} };
  vm.runInNewContext(source, {
    module: resultModule, exports: resultModule.exports, process: { env }, console,
    require(name) { return name === "server-only" ? {} : require(name); },
  });
  return resultModule.exports;
}
const legacy = { GITHUB_ID: "legacy-id", GITHUB_SECRET: "legacy-client", NEXTAUTH_SECRET: "legacy-session", NEXTAUTH_URL: "http://localhost:3000" };
const aliases = { AUTH_GITHUB_ID: "alias-id", AUTH_GITHUB_SECRET: "alias-client", AUTH_SECRET: "alias-session", NEXTAUTH_URL: "http://localhost:3000" };
for (const [label, env, expected] of [
  ["legacy names", legacy, [legacy.GITHUB_ID, legacy.GITHUB_SECRET, legacy.NEXTAUTH_SECRET]],
  ["AUTH aliases", aliases, [aliases.AUTH_GITHUB_ID, aliases.AUTH_GITHUB_SECRET, aliases.AUTH_SECRET]],
  ["empty legacy fallback", { ...aliases, GITHUB_ID: "", GITHUB_SECRET: "", NEXTAUTH_SECRET: "" }, [aliases.AUTH_GITHUB_ID, aliases.AUTH_GITHUB_SECRET, aliases.AUTH_SECRET]],
  ["existing v4 credentials take precedence", { ...aliases, ...legacy }, [legacy.GITHUB_ID, legacy.GITHUB_SECRET, legacy.NEXTAUTH_SECRET]],
]) {
  const config = load(env);
  const provider = config.authOptions.providers[0];
  assert.ok(config.hyrjaKonfiguruar());
  assert.ok(provider.id === "github" && provider.options.clientId === expected[0] && provider.options.clientSecret === expected[1]);
  assert.ok(config.authOptions.secret === expected[2]);
  assert.ok(config.authOptions.session.maxAge === 7200);
  console.log(`PASS: ${label}: readiness and provider/session configuration agree (fixture booleans only).`);
}
for (const key of Object.keys(aliases)) {
  const env = { ...aliases }; delete env[key];
  assert.ok(!load(env).hyrjaKonfiguruar());
}
console.log("PASS: missing client ID, client secret, session secret or canonical URL disables readiness.");
