import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi").max(50),
  type: z.enum(["income", "expense"]),
});

export const transactionSchema = z.object({
  categoryId: z.coerce.number().int().positive("Pilih kategori"),
  // Rupiah utuh, harus > 0. Dibatasi ke integer di level Zod SEBELUM
  // masuk ke query -- jangan percaya input form mentah-mentah walau
  // cuma dipakai sendiri; kebiasaan validasi ini yang bikin kode gak
  // rapuh kalau nanti ada fitur import CSV dsb.
  amount: z.coerce.number().int().positive("Jumlah harus lebih dari 0"),
  note: z.string().trim().max(200).optional().or(z.literal("")),
  transactionDate: z.string().min(1, "Tanggal wajib diisi"),
});

export const budgetSchema = z.object({
  categoryId: z.coerce.number().int().positive("Pilih kategori"),
  month: z.string().regex(/^\d{4}-\d{2}-01$/, "Format bulan tidak valid"),
  limitAmount: z.coerce.number().int().positive("Limit harus lebih dari 0"),
});
