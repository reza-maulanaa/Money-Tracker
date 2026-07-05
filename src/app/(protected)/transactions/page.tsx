import { db } from "@/db";
import { categories } from "@/db/schema";
import { desc } from "drizzle-orm";
import { TransactionForm } from "@/components/transaction-form";
import { formatRupiah } from "@/lib/money";
import { deleteTransaction } from "./actions";

export default async function TransactionsPage() {
  const [allCategories, recentTransactions] = await Promise.all([
    db.select().from(categories).orderBy(categories.name),
    db.query.transactions.findMany({
      with: { category: true },
      orderBy: (t) => [desc(t.transactionDate), desc(t.createdAt)],
      limit: 100,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Transaksi</h1>
        <p className="text-sm text-ink/60">
          Catat pemasukan & pengeluaran harian.
        </p>
      </div>

      <TransactionForm categories={allCategories} />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink/50">
              <th className="px-4 py-2 font-medium">Tanggal</th>
              <th className="px-4 py-2 font-medium">Kategori</th>
              <th className="px-4 py-2 font-medium">Catatan</th>
              <th className="px-4 py-2 text-right font-medium">Jumlah</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/40">
                  Belum ada transaksi.
                </td>
              </tr>
            )}
            {recentTransactions.map((tx) => (
              <tr key={tx.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 whitespace-nowrap text-ink/70">
                  {tx.transactionDate}
                </td>
                <td className="px-4 py-2.5">{tx.category.name}</td>
                <td className="px-4 py-2.5 text-ink/50">{tx.note || "-"}</td>
                <td
                  className={
                    "px-4 py-2.5 text-right font-medium whitespace-nowrap " +
                    (tx.category.type === "income"
                      ? "text-income"
                      : "text-expense")
                  }
                >
                  {tx.category.type === "income" ? "+" : "-"}
                  {formatRupiah(tx.amount)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteTransaction.bind(null, tx.id)}>
                    <button
                      type="submit"
                      className="text-xs text-ink/40 hover:text-expense"
                    >
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
