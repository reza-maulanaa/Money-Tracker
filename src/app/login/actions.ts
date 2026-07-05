"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const passcode = formData.get("passcode");
  const correctPasscode = process.env.APP_PASSCODE;

  if (!correctPasscode) {
    // Ketauan pas dev kalau lupa isi .env, bukan silent-fail yang
    // bikin bingung kenapa passcode "bener" tapi tetep ditolak.
    throw new Error("APP_PASSCODE belum diset di environment variables.");
  }

  if (typeof passcode !== "string" || passcode !== correctPasscode) {
    return { error: "Passcode salah." };
  }

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true, // gak bisa diakses lewat JS di browser (proteksi XSS)
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 hari, samain sama masa berlaku JWT
  });

  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
