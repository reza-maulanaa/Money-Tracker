"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createBudget,
  type ActionState,
} from "@/app/(protected)/budgets/actions";

const initialState: ActionState = {};

type Category = { id: number; name: string };

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function BudgetForm({ categories }: { categories: Category[] }) {
  const [state, formAction, isPending] = useActionState(
    createBudget,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const hiddenMonthRef = useRef<HTMLInputElement>(null);

  // Sengaja pake uncontrolled input (ref) buat month picker, BUKAN
  // useState. Kalau di-drive lewat state, reset form sukses harus
  // manggil setState di dalam useEffect -- react-hooks/set-state-in-effect
  // ngasih warning soal itu (bisa cascading render). Uncontrolled +
  // formRef.current.reset() lebih simpel: browser yang balikin ke
  // defaultValue, gak perlu re-render tambahan sama sekali.
  useEffect(() => {
    if (!state.error && !isPending) {
      formRef.current?.reset();
    }
  }, [state, isPending]);

  function syncHiddenMonth(value: string) {
    if (hiddenMonthRef.current) {
      hiddenMonthRef.current.value = `${value}-01`;
    }
  }

  if (categories.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-white p-4 text-sm text-ink/60">
        Belum ada kategori pengeluaran.{" "}
        <a href="/categories" className="text-accent underline">
          Bikin kategori dulu
        </a>
        .
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white p-4"
    >
      {/* input type="month" balikin "YYYY-MM"; kolom `month` di DB butuh
          "YYYY-MM-01". Hidden input di bawah yang nyimpen versi lengkapnya,
          disinkronin lewat onChange di input yang keliatan user. */}
      <input
        ref={hiddenMonthRef}
        type="hidden"
        name="month"
        defaultValue={`${currentMonthValue()}-01`}
      />

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
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="monthPicker" className="text-xs font-medium text-ink/60">
          Bulan
        </label>
        <input
          id="monthPicker"
          type="month"
          defaultValue={currentMonthValue()}
          onChange={(e) => syncHiddenMonth(e.target.value)}
          required
          className="rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="limitAmount" className="text-xs font-medium text-ink/60">
          Limit (Rp)
        </label>
        <input
          id="limitAmount"
          name="limitAmount"
          type="number"
          min={1}
          step={1}
          required
          placeholder="1000000"
          className="w-36 rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Set Budget"}
      </button>

      {state.error && (
        <p className="w-full text-sm text-expense" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
