"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { budgets } from "@/db/schema";
import { pgErrorCode } from "@/lib/pg-error";
import { budgetSchema } from "@/lib/validations";

export type ActionState = { error?: string };

export async function createBudget(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = budgetSchema.safeParse({
    categoryId: formData.get("categoryId"),
    month: formData.get("month"),
    limitAmount: formData.get("limitAmount"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    await db.insert(budgets).values(parsed.data);
  } catch (err) {
    // 23505 = kena constraint unique(categoryId, month) di schema --
    // artinya budget buat kategori+bulan itu udah pernah di-set. Sesuai
    // keputusan lo (manual per bulan, gak auto-roll), user harus hapus
    // dulu yang lama baru bikin baru, bukan overwrite diam-diam.
    if (pgErrorCode(err) === "23505") {
      return {
        error: "Budget buat kategori & bulan ini udah ada. Hapus dulu yang lama.",
      };
    }
    throw err;
  }

  revalidatePath("/budgets");
  return {};
}

export async function deleteBudget(id: number) {
  await db.delete(budgets).where(eq(budgets.id, id));
  revalidatePath("/budgets");
}
