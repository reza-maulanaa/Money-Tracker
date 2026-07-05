// Ambil kode error Postgres (misal "23505" unique violation, "23503" FK
// violation) dari error yang dilempar driver. Kodenya ada di properti
// `code`, BUKAN di message -- ngecek message.includes("23503") gak bakal
// pernah match. Jalanin juga ke `cause` karena drizzle kadang ngebungkus
// error aslinya.
export function pgErrorCode(err: unknown): string | undefined {
  for (
    let e = err;
    typeof e === "object" && e !== null;
    e = (e as { cause?: unknown }).cause
  ) {
    const code = (e as { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
}
