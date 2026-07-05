import {
  pgTable,
  serial,
  text,
  integer,
  date,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Kenapa cuma 2 tipe (income/expense), bukan tipe bebas: kalau kategori
// bisa punya tipe apa aja, perhitungan "total income" vs "total expense"
// di dashboard jadi ambigu -- harus nebak dari nama kategori. Enum di
// level DB maksa data konsisten sejak awal, bukan divalidasi belakangan
// di kode aplikasi doang.
export const categoryTypeEnum = pgEnum("category_type", [
  "income",
  "expense",
]);

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: categoryTypeEnum("type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Kenapa "amount" integer, bukan float atau decimal:
// - Float (real/double) BAHAYA buat duit: 0.1 + 0.2 di floating point
//   gak selalu = 0.3 karena representasi biner gak presisi buat pecahan
//   desepnal. Untuk uang, ini bug yang nyata, bukan teori.
// - Postgres "numeric"/"decimal" itu solusi umum, tapi drizzle balikin
//   nilainya sebagai STRING di JS (biar gak ke-convert ke float diam-diam),
//   jadi tiap kali mau ngitung harus parseFloat/parse manual dulu -- ribet
//   buat kasus kita.
// - Rupiah gak punya subunit yang dipakai sehari-hari (gak ada "sen" di
//   transaksi normal). Jadi kita simpen sebagai integer = jumlah rupiah utuh.
//   Gak ada floating point sama sekali, gak ada string-parsing, tinggal
//   angka biasa. Kalau nanti butuh multi-currency dengan desimal, ini yang
//   pertama harus diubah ke numeric+string.
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    // onDelete "restrict": sengaja BUKAN cascade. Kalau kategori yang
    // masih punya transaksi dihapus, Postgres bakal nolak (error 23503)
    // daripada diam-diam ngilangin histori transaksi. Ini kena tiap kali
    // lo coba hapus kategori yang "dipakai" -- itu perilaku yang benar,
    // bukan bug.
    .references(() => categories.id, { onDelete: "restrict" }),
  amount: integer("amount").notNull(), // rupiah utuh, selalu positif
  note: text("note"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Kenapa "month" disimpen sebagai date (selalu tanggal 1), bukan text
// "2026-07": biar bisa dibandingin & di-sort pake operator date biasa,
// dan gampang di-join sama transactionDate pake date_trunc('month', ...)
// tanpa manipulasi string.
export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      // Beda dari transactions: budget tanpa kategori gak ada gunanya,
      // jadi kalau kategorinya dihapus, budget ikut kehapus (cascade).
      .references(() => categories.id, { onDelete: "cascade" }),
    month: date("month").notNull(), // selalu tanggal 1, misal '2026-07-01'
    limitAmount: integer("limit_amount").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Constraint di level DB: gak boleh ada 2 budget buat kategori yang
    // sama di bulan yang sama. Ini sengaja dipaksa di DB (bukan cuma
    // dicek di kode), sama semangatnya kayak EXCLUDE constraint di
    // project futsal lo -- data integrity gak boleh cuma bergantung ke
    // aplikasi yang "inget" buat validasi.
    unique("budgets_category_month_unique").on(table.categoryId, table.month),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));
