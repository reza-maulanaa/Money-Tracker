"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createCategory,
  type ActionState,
} from "@/app/(protected)/categories/actions";

const initialState: ActionState = {};

export function CategoryForm() {
  const [state, formAction, isPending] = useActionState(
    createCategory,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-xs font-medium text-ink/60">
          Nama kategori
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="misal: Makan, Gaji, Transport"
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="type" className="text-xs font-medium text-ink/60">
          Tipe
        </label>
        <select
          id="type"
          name="type"
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="expense">Pengeluaran</option>
          <option value="income">Pemasukan</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Tambah"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-expense" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
