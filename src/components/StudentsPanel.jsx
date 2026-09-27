import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { bugununTarihi, tarihiKisaYaz } from "../lib/tarih.js";
import { paraYaz, tutarGirdisi, tutariOku } from "../lib/para.js";

const AIDAT_HATASI = "Aidat geçerli bir tutar olmalı. Örn. 1500 veya 1.500,50";

export default function StudentsPanel({ classroom }) {
  const { addStudent, updateStudent, deleteStudent, updateMonthlyFee } = useData();

  const [name, setName] = useState("");
  const [joinDate, setJoinDate] = useState(bugununTarihi);
  const [fee, setFee] = useState("");
  const [error, setError] = useState("");

  const [duzenlenen, setDuzenlenen] = useState(null);
  const [duzenAd, setDuzenAd] = useState("");
  const [duzenTarih, setDuzenTarih] = useState("");
  const [duzenAidat, setDuzenAidat] = useState("");
  const [duzenHata, setDuzenHata] = useState("");
  const [duzenKaydediliyor, setDuzenKaydediliyor] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const temiz = name.trim();

    if (temiz.length < 2) {
      setError("Öğrenci adı en az 2 karakter olmalı.");
      return;
    }
    if (!joinDate) {
      setError("Katılım tarihi seçmelisin.");
      return;
    }

    const ayniIsim = classroom.students.some(
      (student) => student.name.toLowerCase() === temiz.toLowerCase()
    );
    if (ayniIsim) {
      setError("Bu isimde bir öğrenci zaten var.");
      return;
    }

    const aidat = tutariOku(fee);
    if (Number.isNaN(aidat)) {
      setError(AIDAT_HATASI);
      return;
    }

    addStudent(classroom.id, temiz, joinDate, aidat);
    setName("");
    setFee("");
    setError("");
  }

  function duzenlemeyiAc(student) {
    setDuzenlenen(student.id);
    setDuzenAd(student.name);
    setDuzenTarih(student.joinedAt || bugununTarihi());
    setDuzenAidat(tutarGirdisi(student.monthlyFee));
    setDuzenHata("");
  }

  function duzenlemeyiKapat() {
    setDuzenlenen(null);
    setDuzenAd("");
    setDuzenTarih("");
    setDuzenAidat("");
    setDuzenHata("");
  }

  async function duzenlemeyiKaydet(event, student) {
    event.preventDefault();
    const temiz = duzenAd.trim();

    if (temiz.length < 2 || !duzenTarih) return;

    const aidat = tutariOku(duzenAidat);
    if (Number.isNaN(aidat)) {
      setDuzenHata(AIDAT_HATASI);
      return;
    }

    // Aidat degistiyse once sunucu onayini bekle; olmazsa form acik kalsin.
    if (aidat !== (student.monthlyFee ?? null)) {
      setDuzenKaydediliyor(true);
      const sonuc = await updateMonthlyFee(classroom.id, student.id, aidat);
      setDuzenKaydediliyor(false);

      if (!sonuc.ok) {
        setDuzenHata(sonuc.error);
        return;
      }
    }

    updateStudent(classroom.id, student.id, { name: temiz, joinedAt: duzenTarih });
    duzenlemeyiKapat();
  }

  function handleDelete(student) {
    const onay = window.confirm(
      `${student.name} listeden ve tüm yoklama kayıtlarından silinecek.\n\nBu işlem geri alınamaz. Devam edilsin mi?`
    );
    if (onay) {
      deleteStudent(classroom.id, student.id);
    }
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h3>Öğrenciler</h3>
        <span className="header-actions">
          <span className="muted">{classroom.students.length} kişi</span>
        </span>
      </header>

      <form className="inline-form" onSubmit={handleSubmit}>
        <span className="field">
          <label htmlFor="ogrenci-adi">Öğrenci adı soyadı</label>
          <input
            id="ogrenci-adi"
            type="text"
            placeholder="Örn. Ayşe Yılmaz"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </span>
        <span className="field field-narrow">
          <label htmlFor="katilim-tarihi">Katılım tarihi</label>
          <input
            id="katilim-tarihi"
            type="date"
            value={joinDate}
            onChange={(event) => setJoinDate(event.target.value)}
          />
        </span>
        <span className="field field-narrow">
          <label htmlFor="aylik-aidat">Aylık aidat (TL)</label>
          <input
            id="aylik-aidat"
            type="text"
            inputMode="decimal"
            placeholder="İsteğe bağlı"
            value={fee}
            onChange={(event) => setFee(event.target.value)}
          />
        </span>
        <button type="submit" className="button button-primary">
          Ekle
        </button>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {classroom.students.length === 0 ? (
        <section className="empty-state after-form">
          <p className="empty-title">Henüz öğrenci eklenmedi.</p>
          <p className="empty-hint">Ad soyad ve katılım tarihini girip Ekle'ye bas.</p>
        </section>
      ) : (
        <ul className="student-list after-form">
          {classroom.students.map((student, index) =>
            duzenlenen === student.id ? (
              <li key={student.id} className="student-editing">
                <form
                  className="inline-form"
                  onSubmit={(event) => duzenlemeyiKaydet(event, student)}
                >
                  <span className="field">
                    <label htmlFor={`ad-${student.id}`}>Ad soyad</label>
                    <input
                      id={`ad-${student.id}`}
                      type="text"
                      value={duzenAd}
                      onChange={(event) => setDuzenAd(event.target.value)}
                    />
                  </span>
                  <span className="field field-narrow">
                    <label htmlFor={`tarih-${student.id}`}>Katılım tarihi</label>
                    <input
                      id={`tarih-${student.id}`}
                      type="date"
                      value={duzenTarih}
                      onChange={(event) => setDuzenTarih(event.target.value)}
                    />
                  </span>
                  <span className="field field-narrow">
                    <label htmlFor={`aidat-${student.id}`}>Aylık aidat (TL)</label>
                    <input
                      id={`aidat-${student.id}`}
                      type="text"
                      inputMode="decimal"
                      placeholder="Boş: aidat yok"
                      value={duzenAidat}
                      onChange={(event) => setDuzenAidat(event.target.value)}
                    />
                  </span>
                  <button
                    type="submit"
                    className="button button-primary button-small"
                    disabled={duzenKaydediliyor}
                    aria-busy={duzenKaydediliyor}
                  >
                    {duzenKaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                  <button
                    type="button"
                    className="button button-small"
                    onClick={duzenlemeyiKapat}
                    disabled={duzenKaydediliyor}
                  >
                    İptal
                  </button>
                </form>
                {duzenHata && (
                  <p className="form-error" role="alert">
                    {duzenHata}
                  </p>
                )}
              </li>
            ) : (
              <li key={student.id}>
                <span className="order">{index + 1}.</span>
                <span className="cell-name">
                  <span className="cell-name-main">{student.name}</span>
                  <small className="cell-name-note">
                    Katılım: {tarihiKisaYaz(student.joinedAt)} ·{" "}
                    {student.monthlyFee === null || student.monthlyFee === undefined
                      ? "Aidat girilmemiş"
                      : `Aidat: ${paraYaz(student.monthlyFee)}`}
                  </small>
                </span>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => duzenlemeyiAc(student)}
                  aria-label={`${student.name}: Düzenle`}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => handleDelete(student)}
                  aria-label={`${student.name}: Sil`}
                >
                  Sil
                </button>
              </li>
            )
          )}
        </ul>
      )}
    </section>
  );
}