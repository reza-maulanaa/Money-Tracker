// Format integer rupiah jadi string "Rp 150.000". Pake Intl.NumberFormat
// bawaan JS, bukan library eksternal -- ini udah cukup buat kebutuhan kita
// dan gak nambah dependency.
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Balikin tanggal 1 dari bulan yang dikasih, format "YYYY-MM-DD" -- format
// yang dipahami kolom `date` di Postgres.
export function firstOfMonth(year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  return `${year}-${mm}-01`;
}

// Ambil { year, month } "sekarang" MENURUT WIB, buat default filter bulan
// berjalan di dashboard/budget. Ini jalan di server -- di Vercel jam
// server-nya UTC, jadi kalau pake getFullYear()/getMonth() polos, tiap
// tanggal 1 jam 00:00-07:00 WIB dashboard masih nampilin bulan lalu.
// locale "en-CA" formatnya "YYYY-MM-DD", tinggal di-split.
export function currentYearMonth(): { year: number; month: number } {
  const [year, month] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
  })
    .format(new Date())
    .split("-")
    .map(Number);
  return { year, month };
}
