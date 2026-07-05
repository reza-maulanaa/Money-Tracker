"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { pgErrorCode } from "@/lib/pg-error";
import { categorySchema } from "@/lib/validations";

export type ActionState = { error?: string };

export async function createCategory(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(categories).values(parsed.data);
  } catch (err) {
    // 23505 = unique violation: nama kategori udah ada. Ditangkep di sini
    // biar errornya jelas buat user, bukan generic "500 Internal Server
    // Error".
    if (pgErrorCode(err) === "23505") {
      return { error: "Kategori dengan nama itu udah ada." };
    }
    throw err;
  }

  revalidatePath("/categories");
  return {};
}

export async function deleteCategory(id: number) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (err) {
    // onDelete: "restrict" di schema bikin Postgres nolak (23503, FK
    // violation) kalau kategori ini masih dipakai transaksi. Itu perilaku
    // yang benar -- daripada diam-diam ngilangin histori, kita kasih tau
    // user harus hapus transaksinya dulu. Jangan throw Error di sini:
    // di production itu jadi error page generik tanpa pesan. Redirect
    // dengan query param, pesannya dirender di page.
    if (pgErrorCode(err) === "23503") {
      redirect("/categories?error=in-use");
    }
    throw err;
  }
  revalidatePath("/categories");
  // Balik ke URL bersih biar banner error dari percobaan sebelumnya
  // (?error=in-use) gak nempel terus setelah delete yang sukses.
  redirect("/categories");
}
