import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import PrintSheet from "./PrintSheet.jsx";
import {
  bugununTarihi,
  dersBasligi,
  tarihiBicimle,
  tarihiUzunYaz,
} from "../lib/tarih.js";

export default function AttendancePanel({ classroom }) {
  const { addSession, deleteSession, saveSession, online } = useData();

  const [newDate, setNewDate] = useState(bugununTarihi);
  const [newSlot, setNewSlot] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [info, setInfo] = useState("");

  const selected = classroom.sessions.find((item) => item.id === selectedId) || null;

  function derseAitOgrenciler(session) {
    if (!session) return [];
    return classroom.students.filter(
      (student) => !student.joinedAt || student.joinedAt <= session.date
    );
  }

  const gorunenOgrenciler = derseAitOgrenciler(selected);
  const gizlenenSayisi = selected
    ? classroom.students.length - gorunenOgrenciler.length
    : 0;

  function draftOlustur(session) {
    const next = {};
    derseAitOgrenciler(session).forEach((student) => {
      next[student.id] = session.records[student.id] ?? "var";
    });
    return next;
  }

  function dersiAc(session) {
    setSelectedId(session.id);
    setDraft(draftOlustur(session));
    setEditing(!session.saved);
    setError("");
    setSaveError("");
    setInfo("");
  }

  function tarihEkle(event) {
    event.preventDefault();
    const dilim = newSlot.trim();

    if (classroom.students.length === 0) {
      setError("Önce Öğrenciler sekmesinden öğrenci ekle.");
      return;
    }
    if (!newDate) {
      setError("Lütfen bir tarih seç.");
      return;
    }

    const cakisma = classroom.sessions.some(
      (session) => session.date === newDate && (session.slot || "") === dilim
    );
    if (cakisma) {
      setError(
        dilim
          ? `Bu tarihte "${dilim}" adlı ders zaten var.`
          : "Bu tarih zaten eklendi. İkinci ders için ders adı veya saat yaz."
      );
      return;
    }

    const session = addSession(classroom.id, newDate, dilim);
    setNewSlot("");
    dersiAc(session);
  }

  function tarihSil(session) {
    const onay = window.confirm(
      `${dersBasligi(session)} dersi ve tüm işaretleri silinecek.\n\nBu işlem geri alınamaz. Devam edilsin mi?`
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
    gorunenOgrenciler.forEach((student) => {
      next[student.id] = durum;
    });
    setDraft(next);
  }

  async function kaydet(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setInfo("");

    const records = {};
    gorunenOgrenciler.forEach((student) => {
      records[student.id] = draft[student.id] ?? "var";
    });

    const sonuc = await saveSession(classroom.id, selected.id, records);
    setSaving(false);

    if (!sonuc.ok) {
      setSaveError(sonuc.error);
      return;
    }

    setEditing(false);
    setInfo("Yoklama kaydedildi.");
  }

  function duzenle() {
    setDraft(draftOlustur(selected));
    setEditing(true);
    setSaveError("");
    setInfo("");
  }

  function iptal() {
    setDraft(draftOlustur(selected));
    setEditing(false);
    setSaveError("");
    setInfo("");
  }

  const varSayisi = gorunenOgrenciler.filter(
    (student) => (draft[student.id] ?? "var") === "var"
  ).length;
  const yokSayisi = gorunenOgrenciler.length - varSayisi;

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h3>Ders tarihleri</h3>
          <span className="header-actions">
            <span className="muted">{classroom.sessions.length} kayıt</span>
          </span>
        </header>

        <form className="inline-form" onSubmit={tarihEkle}>
          <span className="field field-narrow">
            <label htmlFor="ders-tarihi">Ders tarihi</label>
            <input
              id="ders-tarihi"
              type="date"
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
            />
          </span>
          <span className="field">
            <label htmlFor="ders-dilimi">Ders adı veya saati</label>
            <input
              id="ders-dilimi"
              type="text"
              placeholder="Örn. 1. Ders · 09:00 · Sabah"
              value={newSlot}
              onChange={(event) => setNewSlot(event.target.value)}
            />
          </span>
          <button type="submit" className="button button-primary">
            Ders Ekle
          </button>
        </form>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {classroom.sessions.length === 0 ? (
          <p className="empty" style={{ marginTop: "1rem" }}>
            Henüz ders eklenmedi.
          </p>
        ) : (
          <ul className="session-list" style={{ marginTop: "1rem" }}>
            {classroom.sessions.map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className={
                    session.id === selectedId ? "session-chip is-active" : "session-chip"
                  }
                  onClick={() => dersiAc(session)}
                >
                  <span className="chip-title">
                    <time dateTime={session.date}>{tarihiBicimle(session.date)}</time>
                    {session.slot && <small className="chip-slot">{session.slot}</small>}
                  </span>
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
            <h3>{dersBasligi(selected)}</h3>
            <span className="header-actions">
              <button type="button" className="button" onClick={() => window.print()}>
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
            {varSayisi} var · {yokSayisi} yok · {gorunenOgrenciler.length} öğrenci
          </p>

          {gizlenenSayisi > 0 && (
            <p className="notice">
              {gizlenenSayisi} öğrenci bu tarihten sonra katıldığı için listede yok.
            </p>
          )}

          <form onSubmit={kaydet}>
            <fieldset disabled={!editing || saving}>
              <legend>
                {editing
                  ? "Gelen öğrencilerin kutucuğunu işaretli bırak."
                  : "Kaydedilmiş liste."}
              </legend>

              <ul className="attendance-list">
                {gorunenOgrenciler.map((student) => {
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
                        <span
                          className={durum === "var" ? "status status-ok" : "status status-no"}
                        >
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
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? "Kaydediliyor…" : "Kaydet"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => tumunuIsaretle("var")}
                  disabled={saving}
                >
                  Tümü Var
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => tumunuIsaretle("yok")}
                  disabled={saving}
                >
                  Tümü Yok
                </button>
                {selected.saved && (
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={iptal}
                    disabled={saving}
                  >
                    İptal
                  </button>
                )}
              </footer>
            )}
          </form>

          {!online && (
            <p className="form-error" role="alert">
              İnternet bağlantısı yok. Bağlantı gelince Kaydet'e bas.
            </p>
          )}

          {saveError && (
            <p className="form-error" role="alert">
              {saveError}
            </p>
          )}

          {info && <p className="form-success">{info}</p>}
        </section>
      )}

      {selected && (
        <PrintSheet
          title={`${classroom.name} · Günlük Yoklama`}
          subtitle={
            selected.slot
              ? `${tarihiUzunYaz(selected.date)} · ${selected.slot}`
              : tarihiUzunYaz(selected.date)
          }
        >
          <p className="print-meta">
            <span>Toplam öğrenci: {gorunenOgrenciler.length}</span>
            <span>Gelen: {varSayisi}</span>
            <span>Gelmeyen: {yokSayisi}</span>
          </p>

          <table>
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
              {gorunenOgrenciler.map((student, index) => {
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