import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    const result = isLogin
      ? await login(email, password)
      : await register(email, password, username);

    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate("/", { replace: true });
  }

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setError("");
  }

  return (
    <section className="auth-page">
      <article className="panel">
        <h2>{isLogin ? "Giriş Yap" : "Hesap Oluştur"}</h2>

        <form onSubmit={handleSubmit}>
          <fieldset disabled={busy}>
            <legend>Hesap bilgileri</legend>

            <div className="auth-fields">
              {!isLogin && (
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
                {!isLogin && <small>En az 6 karakter.</small>}
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
              {busy ? "Lütfen bekle…" : isLogin ? "Giriş Yap" : "Hesabı Oluştur"}
            </button>
          </footer>
        </form>

        <p className="auth-switch">
          {isLogin ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
          <button type="button" className="link-button" onClick={switchMode}>
            {isLogin ? "Kayıt ol" : "Giriş yap"}
          </button>
        </p>
      </article>
    </section>
  );
}