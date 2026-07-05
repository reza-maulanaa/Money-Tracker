import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-lg font-semibold text-ink">
          Catatan Keuangan
        </h1>
        <p className="mb-6 text-sm text-ink/60">
          Masukkan passcode buat lanjut.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
