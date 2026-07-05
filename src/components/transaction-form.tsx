"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createTransaction,
  type ActionState,
} from "@/app/(protected)/transactions/actions";

const initialState: ActionState = {};

type Category = {
  id: number;
  name: string;
  type: "income" | "expense";
};

// Tanggal hari ini menurut jam LOKAL browser, format "YYYY-MM-DD" (locale
// en-CA kebetulan formatnya persis itu). Jangan pake toISOString(): itu
// UTC, jadi jam 00:00-07:00 WIB defaultnya nunjuk ke kemarin.
function todayIso() {
  return new Date().toLocaleDateString("en-CA");
}

export function TransactionForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState(
    createTransaction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink/60">
        Belum ada kategori.{" "}
        <a href="/categories" className="text-accent underline">
          Bikin kategori dulu
        </a>{" "}
        sebelum nyatet transaksi.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="categoryId" className="text-xs font-medium text-ink/60">
          Kategori
        </label>
        <select
          id="categoryId"
          name="categoryId"
          required
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name} ({cat.type === "income" ? "masuk" : "keluar"})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="amount" className="text-xs font-medium text-ink/60">
          Jumlah (Rp)
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="50000"
          className="w-32 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="transactionDate"
          className="text-xs font-medium text-ink/60"
        >
          Tanggal
        </label>
        <input
          id="transactionDate"
          name="transactionDate"
          type="date"
          required
          defaultValue={todayIso()}
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-1 min-w-[10rem] flex-col gap-1.5">
        <label htmlFor="note" className="text-xs font-medium text-ink/60">
          Catatan (opsional)
        </label>
        <input
          id="note"
          name="note"
          placeholder="misal: makan siang"
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Catat"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-expense" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
