"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    login,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="passcode" className="text-sm font-medium text-ink">
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          autoFocus
          required
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {state.error && (
        <p className="text-sm text-expense" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Memeriksa..." : "Masuk"}
      </button>
    </form>
  );
}
