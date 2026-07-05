import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// PENTING (Next.js 16): file & fungsi ini namanya "proxy", bukan
// "middleware" lagi -- itu bukan typo. Sejak Next 16, "middleware.ts"
// deprecated dan diganti "proxy.ts" (fungsi export-nya juga ganti nama
// jadi `proxy`). Kalau lo cari tutorial lama yang masih pake
// "middleware.ts", itu convention Next <16 dan gak bakal ke-pickup lagi
// di versi ini (gak ada error, cuma diem-diem gak jalan -- bahaya kalau
// gak ngeh).
//
// Proxy ini SENGAJA "tipis": cuma cek keberadaan cookie session, TANPA
// verifikasi cryptographic (jwtVerify). Itu tugas requireAuth() di
// src/lib/auth.ts, dipanggil dari Server Component. Kenapa dipisah,
// lihat komentar di lib/auth.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath = pathname === "/login";
  if (isPublicPath) {
    return NextResponse.next();
  }

  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);
  if (!hasSessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
