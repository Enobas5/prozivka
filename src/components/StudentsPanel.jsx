import { useState } from "react";
import { useData } from "../context/DataContext.jsx";

export default function StudentsPanel({ classroom }) {
  const { addStudent, deleteStudent } = useData();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const temiz = name.trim();

    if (temiz.length < 2) {
      setError("Öğrenci adı en az 2 karakter olmalı.");
      return;
    }

    const ayniIsim = classroom.students.some(
      (student) => student.name.toLowerCase() === temiz.toLowerCase()
    );
    if (ayniIsim) {
      setError("Bu isimde bir öğrenci zaten var.");
      return;
    }

    addStudent(classroom.id, temiz);
    setName("");
    setError("");
  }

  function handleDelete(student) {
    const onay = window.confirm(
      `${student.name} listeden ve tüm yoklamalardan silinsin mi?`
    );
    if (onay) {
      deleteStudent(classroom.id, student.id);
    }
  }

  return (
    <section className="panel">
      <header className="panel-header">
        <h3>Öğrenciler</h3>
        <span className="muted">{classroom.students.length} kişi</span>
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
          {classroom.students.map((student, index) => (
            <li key={student.id}>
              <span className="order">{index + 1}.</span>
              <span className="student-name">{student.name}</span>
              <button
                type="button"
                className="button button-ghost button-small"
                onClick={() => handleDelete(student)}
              >
                Sil
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}