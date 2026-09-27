import { useData } from "../context/DataContext.jsx";

// Genel veri hatasi: mesaj + kurtarma yolu (tekrar yukle) + kapat.
export default function ErrorBanner() {
  const { error, clearError, reload, loading } = useData();

  if (!error) return null;

  return (
    <p className="form-error banner" role="alert">
      <span>{error}</span>
      <span className="banner-actions">
        <button
          type="button"
          className="button button-small"
          onClick={reload}
          disabled={loading}
          aria-busy={loading}
        >
          Tekrar dene
        </button>
        <button type="button" className="link-button" onClick={clearError}>
          Kapat
        </button>
      </span>
    </p>
  );
}
