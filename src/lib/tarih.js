// Bugunun tarihi, yerel saat dilimine gore YYYY-AA-GG.
export function bugununTarihi() {
  const simdi = new Date();
  const fark = simdi.getTimezoneOffset() * 60000;
  return new Date(simdi.getTime() - fark).toISOString().slice(0, 10);
}

// 2026-10-14  ->  14.10.2026
export function tarihiBicimle(iso) {
  if (!iso) return "";
  const [yil, ay, gun] = iso.split("-");
  return `${gun}.${ay}.${yil}`;
}

// 2026-10-14  ->  14 Ekim 2026 Çarşamba
export function tarihiUzunYaz(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

// 2026-10-14  ->  14 Ekim 2026
export function tarihiKisaYaz(iso) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Tam zaman damgasindan sadece gun kismini alir.
export function gunDamgasi(zamanDamgasi) {
  if (!zamanDamgasi) return "";
  return String(zamanDamgasi).slice(0, 10);
}

// Ders basligi: "14.10.2026" veya "14.10.2026 · 2. Ders"
export function dersBasligi(session) {
  if (!session) return "";
  const tarih = tarihiBicimle(session.date);
  return session.slot ? `${tarih} · ${session.slot}` : tarih;
}

// ---------- Aylik donem (YYYY-AA) ----------

// Icinde bulunulan ay: 2026-09
export function buAy() {
  return bugununTarihi().slice(0, 7);
}

// 2026-09  ->  Eylül 2026
export function ayiYaz(donem) {
  if (!donem) return "";
  const [yil, ay] = donem.split("-").map(Number);
  return new Date(yil, ay - 1, 1).toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });
}

// 2026-12, +1  ->  2027-01
export function ayKaydir(donem, fark) {
  const [yil, ay] = donem.split("-").map(Number);
  const tarih = new Date(yil, ay - 1 + fark, 1);
  return `${tarih.getFullYear()}-${String(tarih.getMonth() + 1).padStart(2, "0")}`;
}

// 2026-02  ->  2026-02-28
export function ayinSonGunu(donem) {
  const [yil, ay] = donem.split("-").map(Number);
  const gun = new Date(yil, ay, 0).getDate();
  return `${donem}-${String(gun).padStart(2, "0")}`;
}
