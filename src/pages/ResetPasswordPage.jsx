import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ResetPasswordPage() {
  const { user, ready, recovering, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== repeat) {
      setError("Şifreler birbiriyle eşleşmiyor.");
      return;
    }

    setBusy(true);
    const sonuc = await updatePassword(password);
    setBusy(false);

    if (!sonuc.ok) {
      setError(sonuc.error);
      return;
    }

    setDone(true);
  }

  async function girisEkraninaDon() {
    await logout();
    navigate("/giris", { replace: true });
  }

  if (!ready) {
    return <p className="loading">Yükleniyor…</p>;
  }

  if (done) {
    return (
      <section className="auth-page">
        <article className="panel">
          <h2>Şifren değiştirildi</h2>
          <p className="form-success">
            Yeni şifren kaydedildi. Artık bu şifreyle giriş yapabilirsin.
          </p>
          <footer className="panel-footer">
            <button type="button" className="button button-primary" onClick={girisEkraninaDon}>
              Giriş Ekranına Dön
            </button>
          </footer>
        </article>
      </section>
    );
  }

  // Baglanti gecersizse veya dogrudan bu adrese girildiyse.
  if (!user && !recovering) {
    return (
      <section className="auth-page">
        <article className="panel">
          <h2>Bağlantı geçersiz</h2>
          <p className="muted">
            Sıfırlama bağlantısı süresi dolmuş veya daha önce kullanılmış olabilir. Giriş
            ekranından yeni bir bağlantı iste.
          </p>
          <footer className="panel-footer">
            <Link className="button button-primary" to="/giris">
              Giriş Ekranına Dön
            </Link>
          </footer>
        </article>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <article className="panel">
        <h2>Yeni Şifre Belirle</h2>
        {user?.email && <p className="muted">{user.email}</p>}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy}>
            <legend>Yeni şifre</legend>

            <div className="auth-fields">
              <p className="field">
                <label htmlFor="yeni-sifre">Yeni şifre</label>
                <input
                  id="yeni-sifre"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <small>En az 6 karakter.</small>
              </p>

              <p className="field">
                <label htmlFor="sifre-tekrar">Şifre tekrar</label>
                <input
                  id="sifre-tekrar"
                  type="password"
                  autoComplete="new-password"
                  value={repeat}
                  onChange={(event) => setRepeat(event.target.value)}
                  required
                />
              </p>
            </div>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <footer className="panel-footer">
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Şifreyi Kaydet"}
            </button>
          </footer>
        </form>
      </article>
    </section>
  );
}