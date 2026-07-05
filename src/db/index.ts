import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diset. Cek file .env.local kamu.");
}

// neon-http (bukan neon-websockets/Pool): setiap query = 1 HTTP request
// ke Neon, gak ada connection pool yang perlu dijaga. Cocok buat
// serverless functions Vercel yang hidup-mati per request -- sama
// alasannya kayak kenapa lo pake pola ini di zazstore/notes-app.
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
