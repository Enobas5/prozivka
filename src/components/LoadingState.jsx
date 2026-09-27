// Yuklenirken sayfanin iskeleti. Metin ekran okuyucular icin korunur.
// variant: "page" (genel), "cards" (sinif listesi), "class" (sinif sayfasi)
export default function LoadingState({ label, variant = "page" }) {
  return (
    <section aria-busy="true">
      <p className="visually-hidden" role="status">
        {label}
      </p>

      {variant === "cards" && (
        <ul className="class-grid" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <li key={i}>
              <span className="skeleton skeleton-card" />
            </li>
          ))}
        </ul>
      )}

      {variant === "class" && (
        <header className="page-header" aria-hidden="true">
          <span className="skeleton skeleton-line is-short" />
          <span className="skeleton skeleton-title" />
          <span className="skeleton skeleton-line is-short" />
          <span className="skeleton skeleton-tabs" />
        </header>
      )}

      {variant !== "cards" && (
        <article className="panel" aria-hidden="true">
          <span className="skeleton skeleton-line is-medium" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line" />
          <span className="skeleton skeleton-line is-short" />
        </article>
      )}
    </section>
  );
}
