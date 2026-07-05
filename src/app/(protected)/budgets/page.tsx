import { and, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, transactions } from "@/db/schema";
import { BudgetForm } from "@/components/budget-form";
import { formatRupiah, currentYearMonth, firstOfMonth } from "@/lib/money";
import { deleteBudget } from "./actions";

export default async function BudgetsPage() {
  const { year, month } = currentYearMonth();
  const monthStart = firstOfMonth(year, month);
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const monthEnd = firstOfMonth(nextMonth.year, nextMonth.month);

  const expenseCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(eq(categories.type, "expense"))
    .orderBy(categories.name);

  const monthBudgets = await db.query.budgets.findMany({
    where: (b) => eq(b.month, monthStart),
    with: { category: true },
  });

  // Total pengeluaran per kategori di bulan berjalan -- di-groupBy di
  // level SQL (bukan ditarik semua transaksi lalu di-sum di JS), biar
  // gak nge-fetch data yang gak perlu ke aplikasi.
  const spentRows = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<string>`coalesce(sum(${transactions.amount}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        gte(transactions.transactionDate, monthStart),
        lt(transactions.transactionDate, monthEnd),
      ),
    )
    .groupBy(transactions.categoryId);

  const spentByCategory = new Map(
    spentRows.map((row) => [row.categoryId, Number(row.spent)]),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Budget</h1>
        <p className="text-sm text-ink/60">
          Progress budget bulan ini ({monthStart.slice(0, 7)}).
        </p>
      </div>

      <BudgetForm categories={expenseCategories} />

      <div className="flex flex-col gap-3">
        {monthBudgets.length === 0 && (
          <p className="rounded-xl border border-line bg-white p-4 text-center text-sm text-ink/40">
            Belum ada budget buat bulan ini.
          </p>
        )}
        {monthBudgets.map((budget) => {
          const spent = spentByCategory.get(budget.categoryId) ?? 0;
          const percentage = Math.min(
            100,
            Math.round((spent / budget.limitAmount) * 100),
          );
          const isOver = spent > budget.limitAmount;

          return (
            <div
              key={budget.id}
              className="rounded-xl border border-line bg-white p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-ink">
                  {budget.category.name}
                </span>
                <form action={deleteBudget.bind(null, budget.id)}>
                  <button
                    type="submit"
                    className="text-xs text-ink/40 hover:text-expense"
                  >
                    Hapus
                  </button>
                </form>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={
                    "h-full rounded-full " +
                    (isOver ? "bg-expense" : "bg-accent")
                  }
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-sm">
                <span className={isOver ? "font-medium text-expense" : "text-ink/70"}>
                  {formatRupiah(spent)} / {formatRupiah(budget.limitAmount)}
                </span>
                <span className={isOver ? "font-medium text-expense" : "text-ink/50"}>
                  {isOver ? "Lewat budget!" : `${percentage}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
