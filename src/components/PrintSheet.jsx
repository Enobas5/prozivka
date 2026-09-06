import { createPortal } from "react-dom";

export default function PrintSheet({ title, subtitle, children }) {
  const olusturma = new Date().toLocaleString("tr-TR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return createPortal(
    <article className="print-sheet">
      <header>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </header>

      {children}

      <footer>
        <p>prozivka · {olusturma} tarihinde oluşturuldu</p>
      </footer>
    </article>,
    document.body
  );
}