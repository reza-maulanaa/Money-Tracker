import { and, eq, gte, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { categories, transactions, budgets } from "@/db/schema";
import { formatRupiah, currentYearMonth, firstOfMonth } from "@/lib/money";

export default async function DashboardPage() {
  const { year, month } = currentYearMonth();
  const monthStart = firstOfMonth(year, month);
  const nextMonth =
    month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const monthEnd = firstOfMonth(nextMonth.year, nextMonth.month);

  const totalsByType = await db
    .select({
      type: categories.type,
      total: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .innerJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        gte(transactions.transactionDate, monthStart),
        lt(transactions.transactionDate, monthEnd),
      ),
    )
    .groupBy(categories.type);

  const income = Number(
    totalsByType.find((row) => row.type === "income")?.total ?? 0,
  );
  const expense = Number(
    totalsByType.find((row) => row.type === "expense")?.total ?? 0,
  );
  const net = income - expense;
  const savingRate = income > 0 ? Math.round((net / income) * 100) : null;

  const overBudgetCount = await db
    .select({
      categoryId: budgets.categoryId,
      limitAmount: budgets.limitAmount,
      spent: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(budgets)
    .leftJoin(
      transactions,
      and(
        eq(transactions.categoryId, budgets.categoryId),
        gte(transactions.transactionDate, monthStart),
        lt(transactions.transactionDate, monthEnd),
      ),
    )
    .where(eq(budgets.month, monthStart))
    .groupBy(budgets.id, budgets.categoryId, budgets.limitAmount)
    .then((rows) => rows.filter((r) => Number(r.spent) > r.limitAmount).length);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink/60">
          Ringkasan bulan ini ({monthStart.slice(0, 7)}).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-ink/50">Pemasukan</p>
          <p className="mt-1 text-lg font-semibold text-income">
            {formatRupiah(income)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-ink/50">Pengeluaran</p>
          <p className="mt-1 text-lg font-semibold text-expense">
            {formatRupiah(expense)}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="text-xs font-medium text-ink/50">
            Net {savingRate !== null && `(saving rate ${savingRate}%)`}
          </p>
          <p
            className={
              "mt-1 text-lg font-semibold " +
              (net >= 0 ? "text-income" : "text-expense")
            }
          >
            {formatRupiah(net)}
          </p>
        </div>
      </div>

      {overBudgetCount > 0 && (
        <div className="rounded-xl border border-expense/30 bg-expense/5 p-4 text-sm">
          <span className="font-medium text-expense">
            {overBudgetCount} kategori
          </span>{" "}
          udah lewat budget bulan ini.{" "}
          <Link href="/budgets" className="underline">
            Lihat detail
          </Link>
        </div>
      )}

      <div className="flex gap-3 text-sm">
        <Link
          href="/transactions"
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Catat transaksi
        </Link>
        <Link
          href="/budgets"
          className="rounded-lg border border-line px-4 py-2 font-medium text-ink hover:bg-line/30"
        >
          Atur budget
        </Link>
      </div>
    </div>
  );
}
