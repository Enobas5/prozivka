import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";

export default function Header() {
  const { user, logout } = useAuth();
  const { pending, loading, reload } = useData();

  let durum = "Kayıtlı";
  if (loading) durum = "Yükleniyor…";
  else if (pending > 0) durum = "Kaydediliyor…";

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" to="/">
          <strong>prozivka</strong>
          <small>yoklama sistemi</small>
        </Link>

        {user && (
          <nav aria-label="Kullanıcı menüsü">
            <output className="sync-status" aria-live="polite">
              {durum}
            </output>
            <span className="user-name">{user.username}</span>
            <button
              type="button"
              className="button button-small"
              onClick={reload}
              disabled={loading || pending > 0}
            >
              Yenile
            </button>
            <button type="button" className="button button-small" onClick={logout}>
              Çıkış Yap
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}