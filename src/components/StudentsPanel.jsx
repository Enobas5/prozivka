import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import { bugununTarihi, tarihiKisaYaz } from "../lib/tarih.js";

export default function StudentsPanel({ classroom }) {
  const { addStudent, updateStudent, deleteStudent } = useData();

  const [name, setName] = useState("");
  const [joinDate, setJoinDate] = useState(bugununTarihi);
  const [error, setError] = useState("");

  const [duzenlenen, setDuzenlenen] = useState(null);
  const [duzenAd, setDuzenAd] = useState("");
  const [duzenTarih, setDuzenTarih] = useState("");

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

    addStudent(classroom.id, temiz, joinDate);
    setName("");
    setError("");
  }

  function duzenlemeyiAc(student) {
    setDuzenlenen(student.id);
    setDuzenAd(student.name);
    setDuzenTarih(student.joinedAt || bugununTarihi());
  }

  function duzenlemeyiKapat() {
    setDuzenlenen(null);
    setDuzenAd("");
    setDuzenTarih("");
  }

  function duzenlemeyiKaydet(event, student) {
    event.preventDefault();
    const temiz = duzenAd.trim();

    if (temiz.length < 2 || !duzenTarih) return;

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
        <p className="empty" style={{ marginTop: "1rem" }}>
          Henüz öğrenci eklenmedi.
        </p>
      ) : (
        <ul className="student-list" style={{ marginTop: "1rem" }}>
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
                  <button type="submit" className="button button-primary button-small">
                    Kaydet
                  </button>
                  <button
                    type="button"
                    className="button button-small"
                    onClick={duzenlemeyiKapat}
                  >
                    İptal
                  </button>
                </form>
              </li>
            ) : (
              <li key={student.id}>
                <span className="order">{index + 1}.</span>
                <span className="cell-name">
                  <span className="cell-name-main">{student.name}</span>
                  <small className="cell-name-note">
                    Katılım: {tarihiKisaYaz(student.joinedAt)}
                  </small>
                </span>
                <button
                  type="button"
                  className="button button-small"
                  onClick={() => duzenlemeyiAc(student)}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => handleDelete(student)}
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