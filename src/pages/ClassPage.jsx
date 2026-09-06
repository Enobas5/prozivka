import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import StudentsPanel from "../components/StudentsPanel.jsx";
import AttendancePanel from "../components/AttendancePanel.jsx";
import ReportPanel from "../components/ReportPanel.jsx";

const TABS = [
  { id: "ogrenciler", label: "Öğrenciler" },
  { id: "yoklama", label: "Yoklama" },
  { id: "devam", label: "Devam Durumu" },
];

export default function ClassPage() {
  const { classId } = useParams();
  const { getClass, loading, error, clearError } = useData();
  const [activeTab, setActiveTab] = useState("ogrenciler");

  const classroom = getClass(classId);

  if (!classroom && loading) {
    return <p className="loading">Sınıf yükleniyor…</p>;
  }

  if (!classroom) {
    return (
      <section className="panel">
        <h2>Sınıf bulunamadı</h2>
        <p className="muted">Bu sınıf silinmiş olabilir.</p>
        <Link className="button button-primary" to="/">
          Sınıflara dön
        </Link>
      </section>
    );
  }

  return (
    <article>
      <header className="page-header">
        <p className="breadcrumb">
          <Link to="/">Sınıflarım</Link> / {classroom.name}
        </p>
        <h2>{classroom.name}</h2>
        <p className="muted">
          {classroom.students.length} öğrenci · {classroom.sessions.length} ders tarihi
        </p>
      </header>

      {error && (
        <p className="form-error" role="alert">
          {error}{" "}
          <button type="button" className="link-button" onClick={clearError}>
            Kapat
          </button>
        </p>
      )}

      <nav className="tabs" aria-label="Sınıf sekmeleri">
        <ul>
          {TABS.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                className={tab.id === activeTab ? "tab-button is-active" : "tab-button"}
                aria-current={tab.id === activeTab ? "page" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {activeTab === "ogrenciler" && <StudentsPanel classroom={classroom} />}
      {activeTab === "yoklama" && <AttendancePanel classroom={classroom} />}
      {activeTab === "devam" && <ReportPanel classroom={classroom} />}
    </article>
  );
}