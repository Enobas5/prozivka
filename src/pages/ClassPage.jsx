import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useData } from "../context/DataContext.jsx";
import StudentsPanel from "../components/StudentsPanel.jsx";
import AttendancePanel from "../components/AttendancePanel.jsx";
import ReportPanel from "../components/ReportPanel.jsx";
import PaymentsPanel from "../components/PaymentsPanel.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingState from "../components/LoadingState.jsx";

const TABS = [
  { id: "ogrenciler", label: "Öğrenciler" },
  { id: "yoklama", label: "Yoklama" },
  { id: "devam", label: "Devam Durumu" },
  { id: "odemeler", label: "Ödemeler" },
];

export default function ClassPage() {
  const { classId } = useParams();
  const { getClass, loading } = useData();
  const [activeTab, setActiveTab] = useState("ogrenciler");

  const classroom = getClass(classId);

  if (!classroom && loading) {
    return <LoadingState label="Sınıf yükleniyor…" variant="class" />;
  }

  if (!classroom) {
    return (
      <>
        <ErrorBanner />
        <section className="panel">
          <h2>Sınıf bulunamadı</h2>
          <p className="muted">Bu sınıf silinmiş olabilir.</p>
          <footer className="panel-footer">
            <Link className="button button-primary" to="/">
              Sınıflara dön
            </Link>
          </footer>
        </section>
      </>
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

      <ErrorBanner />

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
      {activeTab === "odemeler" && <PaymentsPanel classroom={classroom} />}
    </article>
  );
}