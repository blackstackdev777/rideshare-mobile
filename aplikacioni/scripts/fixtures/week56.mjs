// TEST PROCESS ONLY. Loaded with --import by test-week56.mjs.
// No production source imports this file. All outbound fetches are intercepted.
import assert from "node:assert/strict";
const seed = [
  { id: 1, nisja: "Prishtinë", destinacioni: "AAB", ora: "08:00:00", cmimi: "2.00", vendet_e_lira: 2, shofer_id: "54321" },
  { id: 2, nisja: "Fushë Kosovë", destinacioni: "AAB", ora: "08:15:00", cmimi: "2.00", vendet_e_lira: 1, shofer_id: "12345" },
  { id: 3, nisja: "Lipjan", destinacioni: "AAB", ora: "07:45:00", cmimi: "3.00", vendet_e_lira: 0, shofer_id: null },
];
let trips, profiles, queries, revoke, updateFault;
function reset() {
  trips = structuredClone(seed);
  profiles = new Map([
    ["12345", { id: "12345", emri: "Fixture Driver", roli: "shofer" }],
    ["54321", { id: "54321", emri: "Other Driver", roli: "shofer" }],
  ]);
  queries = [];
  revoke = false;
  updateFault = null;
}
reset();
const types = { id: 23, nisja: 1043, destinacioni: 1043, ora: 1083, cmimi: 1700, vendet_e_lira: 23, emri: 25, roli: 25 };
function result(rows, columns, command) {
  return new Response(JSON.stringify({
    fields: columns.map(name => ({ name, dataTypeID: name === "id" && columns.includes("roli") ? 25 : types[name] })),
    rows: rows.map(row => columns.map(name => row[name])), rowCount: rows.length, command, rowAsArray: true,
  }), { status: 200 });
}
globalThis.fetch = async (_url, options) => {
  // Neon is the only allowed outgoing transport. An unexpected call fails closed.
  const payload = JSON.parse(options?.body ?? "{}");
  const { query, params = [] } = payload;
  assert.equal(typeof query, "string", "Unexpected outbound request blocked");
  queries.push({ query, params });
  if (/INSERT INTO profilet/.test(query)) {
    assert.doesNotMatch(query, /\(github_id,\s*emri,\s*roli\)/);
    if (!profiles.has(params[0])) profiles.set(params[0], { id: params[0], emri: params[1], roli: "udhetar" });
    return result([], [], "INSERT");
  }
  if (/SELECT github_id AS id/.test(query)) {
    return result(profiles.has(params[0]) ? [profiles.get(params[0])] : [], ["id", "emri", "roli"], "SELECT");
  }
  if (/SELECT id, ora FROM udhetimet/.test(query)) {
    assert.match(query, /WHERE id = \$1 AND shofer_id = \$2/);
    assert.equal(params[1], params[2]);
    return result(trips.filter(t => t.id === Number(params[0]) && t.shofer_id === params[1] && profiles.get(params[1])?.roli === "shofer"), ["id", "ora"], "SELECT");
  }
  if (/UPDATE udhetimet SET ora/.test(query)) {
    assert.match(query, /WHERE id = \$2 AND shofer_id = \$3/);
    assert.match(query, /EXISTS \(SELECT 1 FROM profilet WHERE github_id = \$4 AND roli = 'shofer'\)/);
    assert.equal(params[2], params[3]);
    assert.match(query, /RETURNING id, ora/);
    const fault = updateFault; updateFault = null;
    if (fault === "error") throw new Error("PRIVATE_FIXTURE_UPDATE_ERROR");
    if (revoke) { profiles.get(params[2]).roli = "udhetar"; revoke = false; }
    const row = trips.find(t => t.id === Number(params[1]) && t.shofer_id === params[2] && profiles.get(params[2])?.roli === "shofer");
    if (row && fault !== "mismatch") row.ora = `${params[0]}:00`;
    return result(row ? [{ id: row.id, ora: row.ora }] : [], ["id", "ora"], "UPDATE");
  }
  assert.match(query, /SELECT id, nisja, destinacioni, ora, cmimi, vendet_e_lira\s+FROM udhetimet/);
  const rows = /WHERE id/.test(query) ? trips.filter(t => t.id === Number(params[0])) : trips;
  return result(rows, ["id", "nisja", "destinacioni", "ora", "cmimi", "vendet_e_lira"], "SELECT");
};
// IPC is available only in this child process; it is not an HTTP test backdoor.
process.on("message", message => {
  if (message.command === "reset") reset();
  if (message.command === "role") profiles.get("12345").roli = message.role;
  if (message.command === "race") revoke = true;
  if (message.command === "update-fault") updateFault = message.fault;
  process.send({ fixture: message.id, trips, profiles: [...profiles.values()], queries });
});
