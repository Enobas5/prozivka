import { useRef, useState } from "react";
import { useData } from "../context/DataContext.jsx";

export default function BackupPanel() {
  const { classes, exportData, importData } = useData();
  const dosyaGirdisi = useRef(null);

  const [busy, setBusy] = useState(false);
  const [durum, setDurum] = useState("");
  const [hata, setHata] = useState("");

  function yedekAl() {
    setHata("");
    setDurum("");

    try {
      const veri = exportData();
      const metin = JSON.stringify(veri, null, 2);
      const blob = new Blob([metin], { type: "application/json" });
      const adres = URL.createObjectURL(blob);

      const bugun = new Date().toISOString().slice(0, 10);
      const baglanti = document.createElement("a");
      baglanti.href = adres;
      baglanti.download = `prozivka-yedek-${bugun}.json`;
      document.body.appendChild(baglanti);
      baglanti.click();
      document.body.removeChild(baglanti);
      URL.revokeObjectURL(adres);

      setDurum(`${veri.classes.length} sınıf yedeklendi.`);
    } catch (sorun) {
      setHata(`Yedek alınamadı: ${sorun.message}`);
    }
  }

  async function dosyaSecildi(event) {
    const dosya = event.target.files?.[0];
    event.target.value = "";
    if (!dosya) return;

    setHata("");
    setDurum("");

    const onay = window.confirm(
      "Yedekteki sınıflar mevcut listenin üzerine yazılmaz, kopya olarak eklenir.\n\nDevam edilsin mi?"
    );
    if (!onay) return;

    setBusy(true);
    try {
      const metin = await dosya.text();
      const veri = JSON.parse(metin);
      const sonuc = await importData(veri);

      if (!sonuc.ok) {
        setHata(sonuc.error);
      } else {
        setDurum("Yedek yüklendi.");
      }
    } catch (sorun) {
      setHata(`Dosya okunamadı: ${sorun.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h3>Yedekleme</h3>
        <span className="header-actions">
          <span className="muted">{classes.length} sınıf</span>
        </span>
      </header>

      <p className="backup-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={yedekAl}
          disabled={busy || classes.length === 0}
        >
          Yedek Al
        </button>

        <button
          type="button"
          className="button"
          onClick={() => dosyaGirdisi.current?.click()}
          disabled={busy}
        >
          {busy ? "Yükleniyor…" : "Yedeği Yükle"}
        </button>

        <input
          ref={dosyaGirdisi}
          type="file"
          accept="application/json,.json"
          onChange={dosyaSecildi}
          hidden
        />
      </p>

      {hata && (
        <p className="form-error" role="alert">
          {hata}
        </p>
      )}
      {durum && <p className="form-success">{durum}</p>}
    </section>
  );
}