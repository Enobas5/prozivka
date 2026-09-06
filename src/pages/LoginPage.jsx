import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, register, requestPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";

  function modDegistir(yeniMod) {
    setMode(yeniMod);
    setError("");
    setInfo("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");

    let result;
    if (isForgot) {
      result = await requestPasswordReset(email);
    } else if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register(email, password, username);
    }

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    if (isForgot) {
      setInfo(
        "Sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et."
      );
      return;
    }

    navigate("/", { replace: true });
  }

  let baslik = "Giriş Yap";
  if (isRegister) baslik = "Hesap Oluştur";
  if (isForgot) baslik = "Şifremi Unuttum";

  let butonYazisi = "Giriş Yap";
  if (isRegister) butonYazisi = "Hesabı Oluştur";
  if (isForgot) butonYazisi = "Sıfırlama Bağlantısı Gönder";

  return (
    <section className="auth-page">
      <article className="panel">
        <h2>{baslik}</h2>
        {isForgot && (
          <p className="muted">
            Hesabının e-posta adresini yaz, sana bir sıfırlama bağlantısı gönderelim.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy}>
            <legend>Hesap bilgileri</legend>

            <div className="auth-fields">
              {isRegister && (
                <p className="field">
                  <label htmlFor="gorunen-ad">Görünen ad</label>
                  <input
                    id="gorunen-ad"
                    type="text"
                    autoComplete="nickname"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    required
                  />
                </p>
              )}

              <p className="field">
                <label htmlFor="eposta">E-posta</label>
                <input
                  id="eposta"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </p>

              {!isForgot && (
                <p className="field">
                  <label htmlFor="sifre">Şifre</label>
                  <input
                    id="sifre"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  {isRegister && <small>En az 6 karakter.</small>}
                </p>
              )}
            </div>
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          {info && <p className="form-success">{info}</p>}

          <footer className="panel-footer">
            <button type="submit" className="button button-primary" disabled={busy}>
              {busy ? "Lütfen bekle…" : butonYazisi}
            </button>
          </footer>
        </form>

        {isLogin && (
          <p className="auth-switch">
            <button
              type="button"
              className="link-button"
              onClick={() => modDegistir("forgot")}
            >
              Şifremi unuttum
            </button>
          </p>
        )}

        <p className="auth-switch">
          {isForgot ? (
            <button
              type="button"
              className="link-button"
              onClick={() => modDegistir("login")}
            >
              Giriş ekranına dön
            </button>
          ) : (
            <>
              {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
              <button
                type="button"
                className="link-button"
                onClick={() => modDegistir(isLogin ? "register" : "login")}
              >
                {isLogin ? "Kayıt ol" : "Giriş yap"}
              </button>
            </>
          )}
        </p>
      </article>
    </section>
  );
}