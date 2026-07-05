"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { transactionSchema } from "@/lib/validations";

export type ActionState = { error?: string };

export async function createTransaction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionSchema.safeParse({
    categoryId: formData.get("categoryId"),
    amount: formData.get("amount"),
    note: formData.get("note"),
    transactionDate: formData.get("transactionDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await db.insert(transactions).values({
    categoryId: parsed.data.categoryId,
    amount: parsed.data.amount,
    note: parsed.data.note || null,
    transactionDate: parsed.data.transactionDate,
  });

  revalidatePath("/transactions");
  revalidatePath("/"); // dashboard nampilin ringkasan, ikut ke-update
  revalidatePath("/budgets"); // progress budget berubah tiap ada transaksi
  return {};
}

export async function deleteTransaction(id: number) {
  await db.delete(transactions).where(eq(transactions.id, id));
  revalidatePath("/transactions");
  revalidatePath("/");
  revalidatePath("/budgets");
}
