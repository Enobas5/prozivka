import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import BackupPanel from "../components/BackupPanel.jsx";

export default function DashboardPage() {
  const { classes, loading, error, clearError, addClass, deleteClass } = useData();
  const [name, setName] = useState("");
  const [formError, setFormError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setFormError("Sınıf adı en az 2 karakter olmalı.");
      return;
    }

    addClass(name);
    setName("");
    setFormError("");
  }

  function handleDelete(classroom) {
    const ilkOnay = window.confirm(
      `"${classroom.name}" siliniyor.\n\n` +
        `${classroom.students.length} öğrenci ve ${classroom.sessions.length} ders kaydının tamamı kalıcı olarak silinecek.\n\nDevam edilsin mi?`
    );
    if (!ilkOnay) return;

    const yazilan = window.prompt(
      `Onaylamak için sınıfın adını birebir yaz:\n\n${classroom.name}`
    );
    if (yazilan === null) return;

    if (yazilan.trim() !== classroom.name) {
      window.alert("Yazdığın ad eşleşmedi. Silme iptal edildi.");
      return;
    }

    deleteClass(classroom.id);
  }

  return (
    <section>
      <header className="page-header">
        <h2>Sınıflarım</h2>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button type="button" className="link-button" onClick={clearError}>
            Kapat
          </button>
        </p>
      )}

      <section className="panel">
        <header className="panel-header">
          <h3>Yeni sınıf</h3>
        </header>

        <form className="inline-form" onSubmit={handleSubmit}>
          <span className="field">
            <label htmlFor="sinif-adi">Sınıf adı</label>
            <input
              id="sinif-adi"
              type="text"
              placeholder="Örn. 10-A Matematik"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </span>
          <button type="submit" className="button button-primary">
            Sınıf Ekle
          </button>
        </form>

        {formError && (
          <p className="form-error" role="alert">
            {formError}
          </p>
        )}
      </section>

      {loading && classes.length === 0 ? (
        <p className="loading">Sınıfların yükleniyor…</p>
      ) : classes.length === 0 ? (
        <p className="empty">Henüz sınıf yok.</p>
      ) : (
        <ul className="class-grid">
          {classes.map((classroom) => (
            <li key={classroom.id}>
              <article className="class-card">
                <h3>{classroom.name}</h3>
                <p className="muted">
                  {classroom.students.length} öğrenci · {classroom.sessions.length} ders
                </p>
                <footer className="class-card-actions">
                  <Link
                    className="button button-primary button-small"
                    to={`/sinif/${classroom.id}`}
                  >
                    Aç
                  </Link>
                  <button
                    type="button"
                    className="button button-ghost button-small"
                    onClick={() => handleDelete(classroom)}
                  >
                    Sil
                  </button>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}

      <BackupPanel />
    </section>
  );
}