import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { logout } from "@/app/login/actions";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transaksi" },
  { href: "/budgets", label: "Budget" },
  { href: "/categories", label: "Kategori" },
];

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ini pengecekan OTORITATIF (verifikasi cryptographic JWT), bukan cuma
  // cek keberadaan cookie kayak di proxy.ts. Server Component ini jalan
  // di Node runtime penuh, jadi aman & murah buat crypto check di sini.
  await requireAuth();

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink/70 hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-ink/50 hover:text-ink"
            >
              Keluar
            </button>
          </form>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
