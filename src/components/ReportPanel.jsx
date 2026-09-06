import PrintSheet from "./PrintSheet.jsx";
import { tarihiKisaYaz } from "../lib/tarih.js";

export default function ReportPanel({ classroom }) {
  const kayitliDersler = classroom.sessions
    .filter((session) => session.saved)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date > b.date ? 1 : -1;
      return (a.slot || "").localeCompare(b.slot || "", "tr");
    });

  const sinifinIlkDersi = kayitliDersler[0]?.date || null;

  const satirlar = classroom.students.map((student) => {
    let varSayisi = 0;
    let yokSayisi = 0;

    kayitliDersler.forEach((session) => {
      if (student.joinedAt && session.date < student.joinedAt) return;

      const durum = session.records[student.id];
      if (durum !== "var" && durum !== "yok") return;

      if (durum === "var") varSayisi += 1;
      else yokSayisi += 1;
    });

    const toplam = varSayisi + yokSayisi;
    const yuzde = toplam === 0 ? 0 : Math.round((yokSayisi / toplam) * 100);
    const sonradanKatildi = Boolean(
      student.joinedAt && sinifinIlkDersi && student.joinedAt > sinifinIlkDersi
    );

    return {
      id: student.id,
      name: student.name,
      joinedAt: student.joinedAt,
      varSayisi,
      yokSayisi,
      toplam,
      yuzde,
      sonradanKatildi,
    };
  });

  const toplamYok = satirlar.reduce((acc, satir) => acc + satir.yokSayisi, 0);
  const toplamKayit = satirlar.reduce((acc, satir) => acc + satir.toplam, 0);
  const sinifYuzdesi = toplamKayit === 0 ? 0 : Math.round((toplamYok / toplamKayit) * 100);

  if (classroom.students.length === 0) {
    return (
      <section className="panel">
        <h3>Devam Durumu</h3>
        <p className="empty">Önce öğrenci ekle.</p>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <header className="panel-header">
          <h3>Devam Durumu</h3>
          <span className="header-actions">
            <span className="muted">{kayitliDersler.length} kaydedilmiş ders</span>
            {kayitliDersler.length > 0 && (
              <button type="button" className="button" onClick={() => window.print()}>
                PDF Olarak İndir
              </button>
            )}
          </span>
        </header>

        <dl className="summary-grid">
          <div>
            <dt>Öğrenci</dt>
            <dd>{classroom.students.length}</dd>
          </div>
          <div>
            <dt>İşlenen ders</dt>
            <dd>{kayitliDersler.length}</dd>
          </div>
          <div>
            <dt>Toplam devamsızlık</dt>
            <dd>{toplamYok}</dd>
          </div>
          <div>
            <dt>Sınıf devamsızlık oranı</dt>
            <dd>%{sinifYuzdesi}</dd>
          </div>
        </dl>

        {kayitliDersler.length === 0 ? (
          <p className="empty">Henüz kaydedilmiş yoklama yok.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">Öğrenci</th>
                  <th scope="col">Var</th>
                  <th scope="col">Yok</th>
                  <th scope="col">Ders</th>
                  <th scope="col">Devamsızlık</th>
                </tr>
              </thead>
              <tbody>
                {satirlar.map((satir) => (
                  <tr key={satir.id}>
                    <th scope="row">
                      <span className="cell-name">
                        <span className="cell-name-main">{satir.name}</span>
                        {satir.sonradanKatildi && (
                          <small className="cell-name-note">
                            {tarihiKisaYaz(satir.joinedAt)} tarihinden itibaren
                          </small>
                        )}
                      </span>
                    </th>
                    <td className="count-ok">{satir.varSayisi}</td>
                    <td className="count-no">{satir.yokSayisi}</td>
                    <td>{satir.toplam}</td>
                    <td>
                      <meter
                        min="0"
                        max="100"
                        low="20"
                        high="40"
                        optimum="0"
                        value={satir.yuzde}
                      />
                      <span>%{satir.yuzde}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {kayitliDersler.length > 0 && (
        <PrintSheet
          title={`${classroom.name} · Devam Durumu Raporu`}
          subtitle={`${kayitliDersler.length} işlenmiş ders üzerinden hesaplanmıştır`}
        >
          <p className="print-meta">
            <span>Öğrenci: {classroom.students.length}</span>
            <span>Toplam devamsızlık: {toplamYok}</span>
            <span>Sınıf oranı: %{sinifYuzdesi}</span>
          </p>

          <table>
            <caption>
              Döneme sonradan katılanların oranı, yalnızca katıldıkları tarihten itibaren
              işlenen dersler üzerinden hesaplanmıştır.
            </caption>
            <thead>
              <tr>
                <th scope="col" className="col-narrow">
                  No
                </th>
                <th scope="col">Öğrenci</th>
                <th scope="col">Katılım</th>
                <th scope="col" className="col-narrow">
                  Var
                </th>
                <th scope="col" className="col-narrow">
                  Yok
                </th>
                <th scope="col" className="col-narrow">
                  Ders
                </th>
                <th scope="col" className="col-narrow">
                  Oran
                </th>
              </tr>
            </thead>
            <tbody>
              {satirlar.map((satir, index) => (
                <tr key={satir.id}>
                  <td className="mark">{index + 1}</td>
                  <th scope="row">{satir.name}</th>
                  <td>
                    {satir.sonradanKatildi
                      ? `${tarihiKisaYaz(satir.joinedAt)} tarihinden itibaren`
                      : "Dönem başından"}
                  </td>
                  <td className="mark">{satir.varSayisi}</td>
                  <td className="mark">{satir.yokSayisi}</td>
                  <td className="mark">{satir.toplam}</td>
                  <td className="mark">%{satir.yuzde}</td>
                </tr>
              ))}
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