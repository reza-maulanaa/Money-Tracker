import { db } from "@/db";
import { categories } from "@/db/schema";
import { desc } from "drizzle-orm";
import { CategoryForm } from "@/components/category-form";
import { deleteCategory } from "./actions";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const allCategories = await db
    .select()
    .from(categories)
    .orderBy(desc(categories.createdAt));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Kategori</h1>
        <p className="text-sm text-ink/60">
          Kelola kategori pemasukan & pengeluaran.
        </p>
      </div>

      {error === "in-use" && (
        <p
          className="rounded-xl border border-expense/30 bg-expense/5 p-4 text-sm text-expense"
          role="alert"
        >
          Kategori ini masih dipakai di transaksi — gak bisa dihapus. Hapus
          dulu transaksinya di halaman Transaksi.
        </p>
      )}

      <CategoryForm />

      <div className="overflow-hidden rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink/50">
              <th className="px-4 py-2 font-medium">Nama</th>
              <th className="px-4 py-2 font-medium">Tipe</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {allCategories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink/40">
                  Belum ada kategori. Tambahin dulu di atas.
                </td>
              </tr>
            )}
            {allCategories.map((cat) => (
              <tr key={cat.id} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5">{cat.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={
                      cat.type === "income"
                        ? "text-income"
                        : "text-expense"
                    }
                  >
                    {cat.type === "income" ? "Pemasukan" : "Pengeluaran"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <form action={deleteCategory.bind(null, cat.id)}>
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
