import { useState } from "react";
import { useData } from "../context/DataContext.jsx";
import PrintSheet from "./PrintSheet.jsx";
import {
  ayKaydir,
  ayinSonGunu,
  ayiYaz,
  buAy,
  bugununTarihi,
  tarihiBicimle,
} from "../lib/tarih.js";
import { paraYaz } from "../lib/para.js";

const FILTRELER = [
  { id: "tumu", label: "Tümü" },
  { id: "odeyenler", label: "Ödeyenler" },
  { id: "odemeyenler", label: "Ödemeyenler" },
];

export default function PaymentsPanel({ classroom }) {
  const { setPayment, paymentsError, online } = useData();

  const [period, setPeriod] = useState(buAy);
  const [filtre, setFiltre] = useState("tumu");
  const [islenen, setIslenen] = useState(null);
  const [hata, setHata] = useState("");

  const [notDuzenlenen, setNotDuzenlenen] = useState(null);
  const [notMetni, setNotMetni] = useState("");

  // O ayin sonuna kadar katilmis ogrenciler.
  const sonGun = ayinSonGunu(period);
  const kayitlar = classroom.payments?.[period] || {};

  const satirlar = classroom.students
    .filter((student) => !student.joinedAt || student.joinedAt <= sonGun)
    .map((student) => {
      const kayit = kayitlar[student.id] || null;
      const odendi = kayit?.status === "odendi";
      // Odenmis ayda odeme anindaki tutar; bekleyende guncel aidat.
      const tutar = odendi ? kayit.amount : student.monthlyFee ?? null;
      return { student, kayit, odendi, tutar, aidatYok: tutar === null };
    });

  const beklenen = satirlar.reduce((acc, s) => acc + (s.tutar ?? 0), 0);
  const tahsil = satirlar.reduce((acc, s) => acc + (s.odendi ? s.tutar : 0), 0);
  const kalan = beklenen - tahsil;
  const yuzde = beklenen === 0 ? 0 : Math.round((tahsil / beklenen) * 100);
  const aidatsizSayisi = satirlar.filter((s) => s.aidatYok).length;
  const odeyenSayisi = satirlar.filter((s) => s.odendi).length;

  const sayilar = {
    tumu: satirlar.length,
    odeyenler: odeyenSayisi,
    odemeyenler: satirlar.length - odeyenSayisi,
  };

  const gorunenler = satirlar.filter((s) => {
    if (filtre === "odeyenler") return s.odendi;
    if (filtre === "odemeyenler") return !s.odendi;
    return true;
  });

  const kilitli = islenen !== null || Boolean(paymentsError);

  function ayDegistir(yeniDonem) {
    setPeriod(yeniDonem);
    setNotDuzenlenen(null);
    setHata("");
  }

  async function kaydet(studentId, kayit) {
    setIslenen(studentId);
    setHata("");
    const sonuc = await setPayment(classroom.id, studentId, period, kayit);
    setIslenen(null);

    if (!sonuc.ok) {
      setHata(sonuc.error);
      return false;
    }
    return true;
  }

  function durumDegistir(satir) {
    const { student, kayit, odendi } = satir;
    if (!odendi && student.monthlyFee == null) return;

    kaydet(student.id, {
      status: odendi ? "bekliyor" : "odendi",
      amount: odendi ? student.monthlyFee ?? kayit.amount : student.monthlyFee,
      paidAt: odendi ? "" : bugununTarihi(),
      note: kayit?.note || "",
    });
  }

  function notuAc(satir) {
    setNotDuzenlenen(satir.student.id);
    setNotMetni(satir.kayit?.note || "");
    setHata("");
  }

  async function notuKaydet(event, satir) {
    event.preventDefault();
    const { student, kayit } = satir;

    const tamam = await kaydet(student.id, {
      status: kayit?.status || "bekliyor",
      amount: kayit?.amount ?? student.monthlyFee ?? 0,
      paidAt: kayit?.paidAt || "",
      note: notMetni.trim(),
    });
    if (tamam) setNotDuzenlenen(null);
  }

  if (classroom.students.length === 0) {
    return (
      <section className="panel">
        <h3>Ödemeler</h3>
        <p className="empty">Önce öğrenci ekle.</p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h3>Ödemeler</h3>
          <span className="header-actions">
            <span className="muted">{satirlar.length} öğrenci</span>
            {satirlar.length > 0 && (
              <button type="button" className="button" onClick={() => window.print()}>
                PDF Olarak İndir
              </button>
            )}
          </span>
        </header>

        {paymentsError && (
          <p className="form-error" role="alert">
            {paymentsError}. Ödeme tablosu kurulmamış olabilir.
          </p>
        )}

        <nav className="payments-toolbar" aria-label="Ay ve filtre seçimi">
          <p className="month-picker">
            <button
              type="button"
              className="button button-small"
              aria-label="Önceki ay"
              onClick={() => ayDegistir(ayKaydir(period, -1))}
            >
              ‹
            </button>
            <output className="month-label" aria-live="polite">
              {ayiYaz(period)}
            </output>
            <button
              type="button"
              className="button button-small"
              aria-label="Sonraki ay"
              onClick={() => ayDegistir(ayKaydir(period, 1))}
            >
              ›
            </button>
            {period !== buAy() && (
              <button
                type="button"
                className="button button-small"
                onClick={() => ayDegistir(buAy())}
              >
                Bu ay
              </button>
            )}
          </p>

          <ul className="filter-group">
            {FILTRELER.map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className={f.id === filtre ? "button button-small is-active" : "button button-small"}
                  aria-pressed={f.id === filtre}
                  onClick={() => setFiltre(f.id)}
                >
                  {f.label} ({sayilar[f.id]})
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <dl className="summary-grid summary-money">
          <div>
            <dt>Toplam beklenen</dt>
            <dd>{paraYaz(beklenen)}</dd>
          </div>
          <div>
            <dt>Tahsil edilen</dt>
            <dd>{paraYaz(tahsil)}</dd>
          </div>
          <div>
            <dt>Kalan</dt>
            <dd>{paraYaz(kalan)}</dd>
          </div>
          <div>
            <dt>Tahsilat oranı</dt>
            <dd>%{yuzde}</dd>
          </div>
        </dl>

        {aidatsizSayisi > 0 && (
          <p className="notice">
            {aidatsizSayisi} öğrencinin aylık aidatı girilmemiş; toplamlara katılmadı.
            Aidatı Öğrenciler sekmesinde Düzenle ile girebilirsin.
          </p>
        )}

        {satirlar.length === 0 ? (
          <p className="empty">{ayiYaz(period)} için kayıtlı öğrenci yok.</p>
        ) : gorunenler.length === 0 ? (
          <p className="empty">Bu filtreye uyan öğrenci yok.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">Öğrenci</th>
                  <th scope="col">Aidat</th>
                  <th scope="col">Durum</th>
                  <th scope="col">Ödeme tarihi</th>
                  <th scope="col">Not</th>
                </tr>
              </thead>
              <tbody>
                {gorunenler.map((satir) => {
                  const { student, kayit, odendi, tutar, aidatYok } = satir;
                  const buSatirda = islenen === student.id;

                  return (
                    <tr key={student.id}>
                      <th scope="row">{student.name}</th>
                      <td className="money">{tutar === null ? "—" : paraYaz(tutar)}</td>
                      <td>
                        {aidatYok ? (
                          <span className="muted">Aidat girilmemiş</span>
                        ) : (
                          <button
                            type="button"
                            className={odendi ? "pay-toggle is-paid" : "pay-toggle is-pending"}
                            aria-pressed={odendi}
                            title="Değiştirmek için tıkla"
                            onClick={() => durumDegistir(satir)}
                            disabled={kilitli}
                          >
                            {buSatirda ? "Kaydediliyor…" : odendi ? "Ödendi" : "Bekliyor"}
                          </button>
                        )}
                      </td>
                      <td>
                        {kayit?.paidAt ? (
                          <time dateTime={kayit.paidAt}>{tarihiBicimle(kayit.paidAt)}</time>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="cell-note">
                        {notDuzenlenen === student.id ? (
                          <form className="note-form" onSubmit={(event) => notuKaydet(event, satir)}>
                            <input
                              type="text"
                              aria-label={`${student.name} için not`}
                              value={notMetni}
                              onChange={(event) => setNotMetni(event.target.value)}
                              disabled={buSatirda}
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="button button-primary button-small"
                              disabled={kilitli}
                            >
                              {buSatirda ? "Kaydediliyor…" : "Kaydet"}
                            </button>
                            <button
                              type="button"
                              className="button button-small"
                              onClick={() => setNotDuzenlenen(null)}
                              disabled={buSatirda}
                            >
                              İptal
                            </button>
                          </form>
                        ) : (
                          <>
                            {kayit?.note && <span className="note-text">{kayit.note}</span>}
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => notuAc(satir)}
                              disabled={kilitli}
                            >
                              {kayit?.note ? "Düzenle" : "Not ekle"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!online && (
          <p className="form-error" role="alert">
            İnternet bağlantısı yok. Ödeme değişiklikleri kaydedilemez.
          </p>
        )}

        {hata && (
          <p className="form-error" role="alert">
            {hata}
          </p>
        )}
      </section>

      {satirlar.length > 0 && (
        <PrintSheet
          title={`${classroom.name} · Aylık Tahsilat Raporu`}
          subtitle={ayiYaz(period)}
        >
          <table>
            {aidatsizSayisi > 0 && (
              <caption>
                Aylık aidatı girilmemiş öğrenciler toplamlara katılmamıştır.
              </caption>
            )}
            <thead>
              <tr>
                <th scope="col" className="col-narrow">
                  No
                </th>
                <th scope="col">Öğrenci</th>
                <th scope="col">Tutar</th>
                <th scope="col">Durum</th>
                <th scope="col">Ödeme tarihi</th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((satir, index) => (
                <tr key={satir.student.id}>
                  <td className="mark">{index + 1}</td>
                  <th scope="row">{satir.student.name}</th>
                  <td>{satir.tutar === null ? "—" : paraYaz(satir.tutar)}</td>
                  <td>{satir.odendi ? "Ödendi" : satir.aidatYok ? "Aidat yok" : "Bekliyor"}</td>
                  <td>{satir.kayit?.paidAt ? tarihiBicimle(satir.kayit.paidAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="print-meta">
            <span>Beklenen: {paraYaz(beklenen)}</span>
            <span>Tahsil edilen: {paraYaz(tahsil)}</span>
            <span>Kalan: {paraYaz(kalan)}</span>
            <span>Tahsilat: %{yuzde}</span>
          </p>

          <section className="signature">
            <p>Düzenleyen:</p>
            <p>İmza:</p>
          </section>
        </PrintSheet>
      )}
    </>
  );
}
