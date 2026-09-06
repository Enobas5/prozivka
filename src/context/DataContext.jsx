import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "./AuthContext.jsx";
import { bugununTarihi, gunDamgasi } from "../lib/tarih.js";

const DataContext = createContext(null);
const YEDEK_SURUMU = 2;

function yeniId() {
  return crypto.randomUUID();
}

// Yeniden eskiye; ayni gunde ders dilimine gore.
function sortSessions(sessions) {
  return [...sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (a.slot || "").localeCompare(b.slot || "", "tr");
  });
}

function zamanAsimli(sozVerme, ms = 15000) {
  return Promise.race([
    sozVerme,
    new Promise((_, reddet) =>
      setTimeout(() => reddet(new Error("Sunucu yanıt vermedi")), ms)
    ),
  ]);
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

  const pendingRef = useRef(0);

  // ---------- Baglanti takibi ----------

  useEffect(() => {
    function baglandi() {
      setOnline(true);
    }
    function koptu() {
      setOnline(false);
    }
    window.addEventListener("online", baglandi);
    window.addEventListener("offline", koptu);
    return () => {
      window.removeEventListener("online", baglandi);
      window.removeEventListener("offline", koptu);
    };
  }, []);

  // ---------- Veritabanindan tam yukleme ----------

  const reload = useCallback(async () => {
    if (!user) {
      setClasses([]);
      return;
    }

    setLoading(true);
    try {
      const [siniflar, ogrenciler, dersler, yoklamalar] = await Promise.all([
        supabase.from("classes").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("students").select("*").eq("user_id", user.id).order("created_at"),
        supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase.from("attendance").select("*").eq("user_id", user.id),
      ]);

      const hatali = [siniflar, ogrenciler, dersler, yoklamalar].find((r) => r.error);
      if (hatali) throw hatali.error;

      const birlesik = siniflar.data.map((sinif) => ({
        id: sinif.id,
        name: sinif.name,
        createdAt: sinif.created_at,
        students: ogrenciler.data
          .filter((o) => o.class_id === sinif.id)
          .map((o) => ({
            id: o.id,
            name: o.name,
            createdAt: o.created_at,
            joinedAt: o.joined_at || gunDamgasi(o.created_at),
          })),
        sessions: sortSessions(
          dersler.data
            .filter((d) => d.class_id === sinif.id)
            .map((d) => ({
              id: d.id,
              date: d.date,
              slot: d.slot || "",
              saved: d.saved,
              records: Object.fromEntries(
                yoklamalar.data
                  .filter((y) => y.session_id === d.id)
                  .map((y) => [y.student_id, y.status])
              ),
            }))
        ),
      }));

      setClasses(birlesik);
      setError("");
    } catch (hata) {
      setError(`Veriler yüklenemedi: ${hata.message}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    function sekmeyeDonuldu() {
      if (document.visibilityState === "visible" && pendingRef.current === 0) {
        reload();
      }
    }
    document.addEventListener("visibilitychange", sekmeyeDonuldu);
    return () => document.removeEventListener("visibilitychange", sekmeyeDonuldu);
  }, [reload]);

  // ---------- Arka plan gonderimi ----------

  function run(gorev) {
    pendingRef.current += 1;
    setPending(pendingRef.current);

    Promise.resolve()
      .then(gorev)
      .then((sonuc) => {
        if (sonuc && sonuc.error) {
          setError(`Kaydedilemedi: ${sonuc.error.message}`);
        }
      })
      .catch((hata) => {
        setError(`Bağlantı hatası: ${hata.message}`);
      })
      .finally(() => {
        pendingRef.current -= 1;
        setPending(pendingRef.current);
      });
  }

  function updateClass(classId, tarif) {
    setClasses((onceki) =>
      onceki.map((item) => (item.id === classId ? tarif(item) : item))
    );
  }

  function getClass(classId) {
    return classes.find((item) => item.id === classId) || null;
  }

  // ---------- Sinif ----------

  function addClass(name) {
    const classroom = {
      id: yeniId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      students: [],
      sessions: [],
    };

    setClasses((onceki) => [...onceki, classroom]);
    run(() =>
      supabase
        .from("classes")
        .insert({ id: classroom.id, user_id: user.id, name: classroom.name })
    );

    return classroom;
  }

  function deleteClass(classId) {
    setClasses((onceki) => onceki.filter((item) => item.id !== classId));
    run(() => supabase.from("classes").delete().eq("id", classId));
  }

  // ---------- Ogrenci ----------

  function addStudent(classId, name, joinedAt) {
    const student = {
      id: yeniId(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
      joinedAt: joinedAt || bugununTarihi(),
    };

    updateClass(classId, (classroom) => ({
      ...classroom,
      students: [...classroom.students, student],
    }));

    run(() =>
      supabase.from("students").insert({
        id: student.id,
        class_id: classId,
        user_id: user.id,
        name: student.name,
        created_at: student.createdAt,
        joined_at: student.joinedAt,
      })
    );

    return student;
  }

  // Ad ve/veya katilim tarihi guncelleme.
  function updateStudent(classId, studentId, degisiklikler) {
    updateClass(classId, (classroom) => ({
      ...classroom,
      students: classroom.students.map((item) =>
        item.id === studentId ? { ...item, ...degisiklikler } : item
      ),
    }));

    const alanlar = {};
    if (degisiklikler.name !== undefined) alanlar.name = degisiklikler.name;
    if (degisiklikler.joinedAt !== undefined) alanlar.joined_at = degisiklikler.joinedAt;

    run(async () => {
      const guncelle = await supabase.from("students").update(alanlar).eq("id", studentId);
      if (guncelle.error) return guncelle;

      // Katilim tarihi geri cekildiyse, o tarihten onceki
      // yanlis yoklama satirlarini da temizle.
      if (degisiklikler.joinedAt) {
        const sinif = classes.find((c) => c.id === classId);
        const eskiDersler = (sinif?.sessions || [])
          .filter((d) => d.date < degisiklikler.joinedAt)
          .map((d) => d.id);

        if (eskiDersler.length > 0) {
          await supabase
            .from("attendance")
            .delete()
            .eq("student_id", studentId)
            .in("session_id", eskiDersler);
        }
      }
      return null;
    });
  }

  function deleteStudent(classId, studentId) {
    updateClass(classId, (classroom) => ({
      ...classroom,
      students: classroom.students.filter((item) => item.id !== studentId),
      sessions: classroom.sessions.map((session) => {
        const records = { ...session.records };
        delete records[studentId];
        return { ...session, records };
      }),
    }));

    run(() => supabase.from("students").delete().eq("id", studentId));
  }

  // ---------- Ders ----------

  function addSession(classId, date, slot) {
    const session = {
      id: yeniId(),
      date,
      slot: (slot || "").trim(),
      saved: false,
      records: {},
    };

    updateClass(classId, (classroom) => ({
      ...classroom,
      sessions: sortSessions([...classroom.sessions, session]),
    }));

    run(() =>
      supabase.from("sessions").insert({
        id: session.id,
        class_id: classId,
        user_id: user.id,
        date: session.date,
        slot: session.slot,
        saved: false,
      })
    );

    return session;
  }

  function deleteSession(classId, sessionId) {
    updateClass(classId, (classroom) => ({
      ...classroom,
      sessions: classroom.sessions.filter((item) => item.id !== sessionId),
    }));

    run(() => supabase.from("sessions").delete().eq("id", sessionId));
  }

  // ---------- Yoklama kaydi (bekleyen, guvenli) ----------

  async function saveSession(classId, sessionId, records) {
    if (!online) {
      return {
        ok: false,
        error:
          "İnternet bağlantısı yok. Yoklama KAYDEDİLMEDİ. Bağlantı gelince tekrar Kaydet'e bas.",
      };
    }

    const satirlar = Object.entries(records).map(([studentId, status]) => ({
      session_id: sessionId,
      student_id: studentId,
      user_id: user.id,
      status,
    }));

    pendingRef.current += 1;
    setPending(pendingRef.current);

    try {
      if (satirlar.length > 0) {
        const yazma = await zamanAsimli(
          supabase
            .from("attendance")
            .upsert(satirlar, { onConflict: "session_id,student_id" })
        );
        if (yazma.error) throw yazma.error;
      }

      const isaret = await zamanAsimli(
        supabase.from("sessions").update({ saved: true }).eq("id", sessionId)
      );
      if (isaret.error) throw isaret.error;

      updateClass(classId, (classroom) => ({
        ...classroom,
        sessions: classroom.sessions.map((session) =>
          session.id === sessionId
            ? { ...session, records: { ...session.records, ...records }, saved: true }
            : session
        ),
      }));

      setError("");
      return { ok: true };
    } catch (hata) {
      return {
        ok: false,
        error: `Yoklama KAYDEDİLEMEDİ: ${hata.message}. Ekrandaki işaretler duruyor, tekrar dene.`,
      };
    } finally {
      pendingRef.current -= 1;
      setPending(pendingRef.current);
    }
  }

  // ---------- Yedekleme ----------

  function exportData() {
    return {
      format: "prozivka-yedek",
      version: YEDEK_SURUMU,
      exportedAt: new Date().toISOString(),
      classes: classes.map((sinif) => ({
        name: sinif.name,
        createdAt: sinif.createdAt,
        students: sinif.students.map((o) => ({
          id: o.id,
          name: o.name,
          createdAt: o.createdAt,
          joinedAt: o.joinedAt,
        })),
        sessions: sinif.sessions.map((d) => ({
          date: d.date,
          slot: d.slot || "",
          saved: d.saved,
          records: d.records,
        })),
      })),
    };
  }

  async function importData(yedek) {
    if (!yedek || yedek.format !== "prozivka-yedek" || !Array.isArray(yedek.classes)) {
      return { ok: false, error: "Bu dosya bir prozivka yedeği değil." };
    }

    pendingRef.current += 1;
    setPending(pendingRef.current);

    try {
      for (const sinif of yedek.classes) {
        const yeniSinifId = yeniId();

        const sinifYazma = await zamanAsimli(
          supabase.from("classes").insert({
            id: yeniSinifId,
            user_id: user.id,
            name: `${sinif.name} (yedekten)`,
          })
        );
        if (sinifYazma.error) throw sinifYazma.error;

        const eslesme = new Map();
        const ogrenciSatirlari = (sinif.students || []).map((o) => {
          const yeniOgrenciId = yeniId();
          eslesme.set(o.id, yeniOgrenciId);
          return {
            id: yeniOgrenciId,
            class_id: yeniSinifId,
            user_id: user.id,
            name: o.name,
            created_at: o.createdAt || new Date().toISOString(),
            joined_at: o.joinedAt || gunDamgasi(o.createdAt) || bugununTarihi(),
          };
        });

        if (ogrenciSatirlari.length > 0) {
          const ogrenciYazma = await zamanAsimli(
            supabase.from("students").insert(ogrenciSatirlari)
          );
          if (ogrenciYazma.error) throw ogrenciYazma.error;
        }

        for (const ders of sinif.sessions || []) {
          const yeniDersId = yeniId();

          const dersYazma = await zamanAsimli(
            supabase.from("sessions").insert({
              id: yeniDersId,
              class_id: yeniSinifId,
              user_id: user.id,
              date: ders.date,
              slot: ders.slot || "",
              saved: Boolean(ders.saved),
            })
          );
          if (dersYazma.error) throw dersYazma.error;

          const yoklamaSatirlari = Object.entries(ders.records || {})
            .filter(([eskiOgrenciId]) => eslesme.has(eskiOgrenciId))
            .map(([eskiOgrenciId, durum]) => ({
              session_id: yeniDersId,
              student_id: eslesme.get(eskiOgrenciId),
              user_id: user.id,
              status: durum === "yok" ? "yok" : "var",
            }));

          if (yoklamaSatirlari.length > 0) {
            const yoklamaYazma = await zamanAsimli(
              supabase.from("attendance").insert(yoklamaSatirlari)
            );
            if (yoklamaYazma.error) throw yoklamaYazma.error;
          }
        }
      }

      await reload();
      return { ok: true };
    } catch (hata) {
      return { ok: false, error: `Yedek yüklenemedi: ${hata.message}` };
    } finally {
      pendingRef.current -= 1;
      setPending(pendingRef.current);
    }
  }

  const value = {
    classes,
    loading,
    pending,
    error,
    online,
    reload,
    clearError: () => setError(""),
    getClass,
    addClass,
    deleteClass,
    addStudent,
    updateStudent,
    deleteStudent,
    addSession,
    deleteSession,
    saveSession,
    exportData,
    importData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData yalnızca DataProvider içinde kullanılabilir.");
  }
  return context;
}