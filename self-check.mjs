// Self-check kecil buat logic yang gak butuh DB: pgErrorCode & helper
// tanggal. Jalanin dengan: node self-check.mjs  (butuh Node 22.6+)
// ponytail: sengaja bukan framework test -- cuma assert, cukup buat
// internal tool.
const { pgErrorCode } = await import("./src/lib/pg-error.ts");
const { firstOfMonth, currentYearMonth, formatRupiah } = await import(
  "./src/lib/money.ts"
);
import assert from "node:assert";

// pgErrorCode: baca properti `code`, termasuk kalau kebungkus di `cause`.
assert.equal(pgErrorCode(Object.assign(new Error("x"), { code: "23503" })), "23503");
assert.equal(
  pgErrorCode(new Error("wrap", { cause: Object.assign(new Error("y"), { code: "23505" }) })),
  "23505",
);
assert.equal(pgErrorCode(new Error("no code")), undefined);
assert.equal(pgErrorCode(null), undefined);

// Helper tanggal.
assert.equal(firstOfMonth(2026, 7), "2026-07-01");
assert.equal(firstOfMonth(2026, 12), "2026-12-01");
const { year, month } = currentYearMonth();
assert.ok(year >= 2026 && month >= 1 && month <= 12);

// formatRupiah: tanpa desimal, ada pemisah ribuan.
assert.match(formatRupiah(150000), /150\.000/);

console.log("self-check OK");
