import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import PrintSheet from "./PrintSheet.jsx";

function bugununTarihi() {
  const simdi = new Date();
  const fark = simdi.getTimezoneOffset() * 60000;
  return new Date(simdi.getTime() - fark).toISOString().slice(0, 10);
}

function tarihiBicimle(iso) {
  const [yil, ay, gun] = iso.split("-");
  return `${gun}.${ay}.${yil}`;
}

function tarihiUzunYaz(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });
}

export default function AttendancePanel({ classroom }) {
  const { addSession, deleteSession, saveSession } = useData();

  const [newDate, setNewDate] = useState(bugununTarihi);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const selected = classroom.sessions.find((item) => item.id === selectedId) || null;

  function draftOlustur(session) {
    const next = {};
    classroom.students.forEach((student) => {
      next[student.id] = session.records[student.id] ?? "var";
    });
    return next;
  }

  function dersiAc(session) {
    setSelectedId(session.id);
    setDraft(draftOlustur(session));
    setEditing(!session.saved);
    setError("");
    setInfo("");
  }

  function tarihEkle(event) {
    event.preventDefault();

    if (classroom.students.length === 0) {
      setError("Önce Öğrenciler sekmesinden öğrenci ekle.");
      return;
    }
    if (!newDate) {
      setError("Lütfen bir tarih seç.");
      return;
    }
    if (classroom.sessions.some((session) => session.date === newDate)) {
      setError("Bu tarih zaten eklenmiş.");
      return;
    }

    const session = addSession(classroom.id, newDate);
    dersiAc(session);
  }

  function tarihSil(session) {
    const onay = window.confirm(
      `${tarihiBicimle(session.date)} tarihli yoklama silinsin mi?`
    );
    if (!onay) return;

    deleteSession(classroom.id, session.id);
    if (selectedId === session.id) {
      setSelectedId(null);
    }
  }

  function durumDegistir(studentId) {
    setDraft((previous) => ({
      ...previous,
      [studentId]: previous[studentId] === "var" ? "yok" : "var",
    }));
  }

  function tumunuIsaretle(durum) {
    const next = {};
    classroom.students.forEach((student) => {
      next[student.id] = durum;
    });
    setDraft(next);
  }

  function kaydet(event) {
    event.preventDefault();
    const records = {};
    classroom.students.forEach((student) => {
      records[student.id] = draft[student.id] ?? "var";
    });

    saveSession(classroom.id, selected.id, records);
    setEditing(false);
    setInfo("Yoklama kaydedildi. İstediğin an düzenleyebilirsin.");
  }

  function duzenle() {
    setDraft(draftOlustur(selected));
    setEditing(true);
    setInfo("");
  }

  function iptal() {
    setDraft(draftOlustur(selected));
    setEditing(false);
    setInfo("");
  }

  function pdfIndir() {
    window.print();
  }

  const varSayisi = classroom.students.filter(
    (student) => (draft[student.id] ?? "var") === "var"
  ).length;
  const yokSayisi = classroom.students.length - varSayisi;

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h3>Ders tarihleri</h3>
          <span className="muted">{classroom.sessions.length} kayıt</span>
        </header>

        <form className="inline-form" onSubmit={tarihEkle}>
          <span className="field">
            <label htmlFor="ders-tarihi">Ders tarihi</label>
            <input
              id="ders-tarihi"
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
            />
          </span>
          <button type="submit" className="button button-primary">
            Tarih Ekle
          </button>
        </form>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {classroom.sessions.length === 0 ? (
          <p className="empty" style={{ marginTop: "1rem" }}>
            Henüz ders tarihi yok.
          </p>
        ) : (
          <ul className="session-list" style={{ marginTop: "1rem" }}>
            {classroom.sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={
                    session.id === selectedId
                      ? "session-chip is-active"
                      : "session-chip"
                  }
                  onClick={() => dersiAc(session)}
                >
                  <time dateTime={session.date}>{tarihiBicimle(session.date)}</time>
                  <span className={session.saved ? "badge badge-ok" : "badge badge-wait"}>
                    {session.saved ? "Kaydedildi" : "Bekliyor"}
                  </span>
                </button>
                <button
                  type="button"
                  className="button button-ghost button-small"
                  onClick={() => tarihSil(session)}
                >
                  Sil
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected && (
        <section className="panel">
          <header className="panel-header">
            <h3>
              <time dateTime={selected.date}>{tarihiBicimle(selected.date)}</time> yoklaması
            </h3>
            <span className="header-actions">
              <button type="button" className="button" onClick={pdfIndir}>
                PDF Olarak İndir
              </button>
              {selected.saved && !editing && (
                <button type="button" className="button" onClick={duzenle}>
                  Düzenle
                </button>
              )}
            </span>
          </header>

          <p className="muted">
            {varSayisi} var · {yokSayisi} yok
          </p>

          <form onSubmit={kaydet}>
            <fieldset disabled={!editing}>
              <legend>
                {editing
                  ? "Gelen öğrencilerin kutucuğunu işaretli bırak."
                  : "Kaydedilmiş liste (değiştirmek için Düzenle'ye bas)."}
              </legend>

              <ul className="attendance-list">
                {classroom.students.map((student) => {
                  const durum = draft[student.id] ?? "var";
                  return (
                    <li key={student.id}>
                      <label className="attendance-row">
                        <input
                          type="checkbox"
                          checked={durum === "var"}
                          onChange={() => durumDegistir(student.id)}
                        />
                        <span className="student-name">{student.name}</span>
                        <span className={durum === "var" ? "status status-ok" : "status status-no"}>
                          {durum === "var" ? "Var" : "Yok"}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            {editing && (
              <footer className="panel-footer">
                <button type="submit" className="button button-primary">
                  Kaydet
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => tumunuIsaretle("var")}
                >
                  Tümü Var
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => tumunuIsaretle("yok")}
                >
                  Tümü Yok
                </button>
                {selected.saved && (
                  <button type="button" className="button button-ghost" onClick={iptal}>
                    İptal
                  </button>
                )}
              </footer>
            )}
          </form>

          {info && <p className="form-success">{info}</p>}
        </section>
      )}

      {selected && (
        <PrintSheet
          title={`${classroom.name} · Günlük Yoklama`}
          subtitle={tarihiUzunYaz(selected.date)}
        >
          <p className="print-meta">
            <span>Toplam öğrenci: {classroom.students.length}</span>
            <span>Gelen: {varSayisi}</span>
            <span>Gelmeyen: {yokSayisi}</span>
          </p>

          <table>
            <caption>Ders devam çizelgesi</caption>
            <thead>
              <tr>
                <th scope="col" className="col-narrow">
                  No
                </th>
                <th scope="col">Öğrenci</th>
                <th scope="col" className="col-narrow">
                  Var
                </th>
                <th scope="col" className="col-narrow">
                  Yok
                </th>
              </tr>
            </thead>
            <tbody>
              {classroom.students.map((student, index) => {
                const durum = draft[student.id] ?? "var";
                return (
                  <tr key={student.id}>
                    <td className="mark">{index + 1}</td>
                    <th scope="row">{student.name}</th>
                    <td className="mark">{durum === "var" ? "✓" : ""}</td>
                    <td className="mark">{durum === "yok" ? "✓" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <section className="signature">
            <p>Ders öğretmeni:</p>
            <p>İmza:</p>
          </section>
        </PrintSheet>
      )}
    </>
  );
}