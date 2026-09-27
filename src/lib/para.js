const bicimleyici = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// 1500.5  ->  1.500,50 TL
export function paraYaz(tutar) {
  return `${bicimleyici.format(Number(tutar) || 0)} TL`;
}

// Duzenleme kutusuna konacak metin: 1500.5 -> "1.500,50", bos -> ""
export function tutarGirdisi(tutar) {
  if (tutar === null || tutar === undefined) return "";
  return bicimleyici.format(Number(tutar));
}

// Kullanicinin yazdigi tutari sayiya cevirir.
// "1.500,50" / "1500,5" / "1500.5" / "1.500" -> sayi
// Bos -> null, gecersiz -> NaN
export function tutariOku(metin) {
  let temiz = String(metin ?? "")
    .replace(/TL|₺/gi, "")
    .replace(/\s/g, "");
  if (temiz === "") return null;

  if (temiz.includes(",")) {
    // Turk bicimi: nokta binlik, virgul ondalik
    temiz = temiz.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(temiz)) {
    // "1.500" gibi yalnizca binlik ayraci
    temiz = temiz.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(temiz)) return NaN;
  return Math.round(Number(temiz) * 100) / 100;
}
