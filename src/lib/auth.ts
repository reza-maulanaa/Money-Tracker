import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE_NAME = "session";
const SESSION_DURATION = "30d";

function getSecret() {
  const secret = process.env.APP_COOKIE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "APP_COOKIE_SECRET belum diset atau kurang dari 32 karakter. " +
        "Generate dengan: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

// Bikin token setelah passcode benar. Payloadnya sengaja minim
// (cuma boolean authenticated) -- app ini single-user, gak ada role
// atau permission yang perlu dibedain, jadi gak perlu userId/claims lain
// kayak di Notes-app/zazstore yang multi-user.
export async function createSessionToken() {
  return new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.authenticated === true;
  } catch {
    // Token gak valid/expired/di-tamper -- treat as "belum login".
    return false;
  }
}

// requireAuth() = pemeriksaan OTORITATIF. Dipanggil di Server Component
// (layout/page), bukan di proxy.ts.
//
// Kenapa dipisah dari proxy.ts: sejak Next.js 16, proxy.ts (dulu
// middleware.ts) resminya cuma buat keputusan routing yang MURAH --
// redirect/rewrite/header. Verifikasi JWT yang "berat" (crypto check)
// dipindah ke sini, di layer Server Component, biar proxy tetep ringan
// dan gak jadi tempat nyimpen logic auth yang kompleks. Ini juga related
// sama CVE-2025-29927 yang udah lo flag sebelumnya di project futsal --
// itu soal auth bypass di middleware, dan restrukturisasi proxy.ts di
// Next 16 ini sebagian besar respons ke masalah kelas itu.
export async function requireAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);

  if (!isValid) {
    redirect("/login");
  }
}
