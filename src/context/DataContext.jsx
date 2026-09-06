import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "./AuthContext.jsx";

const DataContext = createContext(null);

function yeniId() {
  return crypto.randomUUID();
}

function sortSessions(sessions) {
  return [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function DataProvider({ children }) {
  const { user } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(0);
  const [error, setError] = useState("");

  const pendingRef = useRef(0);

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
        supabase.from("sessions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
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
          .map((o) => ({ id: o.id, name: o.name })),
        sessions: sortSessions(
          dersler.data
            .filter((d) => d.class_id === sinif.id)
            .map((d) => ({
              id: d.id,
              date: d.date,
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

  // Sekmeye geri donuldugunde baska cihazdaki degisiklikleri al.
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

  function addStudent(classId, name) {
    const student = { id: yeniId(), name: name.trim() };

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
      })
    );

    return student;
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

  // ---------- Ders tarihi ----------

  function addSession(classId, date) {
    const session = { id: yeniId(), date, saved: false, records: {} };

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

  // ---------- Yoklama kaydi ----------

  function saveSession(classId, sessionId, records) {
    updateClass(classId, (classroom) => ({
      ...classroom,
      sessions: classroom.sessions.map((session) =>
        session.id === sessionId
          ? { ...session, records: { ...records }, saved: true }
          : session
      ),
    }));

    const satirlar = Object.entries(records).map(([studentId, status]) => ({
      session_id: sessionId,
      student_id: studentId,
      user_id: user.id,
      status,
    }));

    run(async () => {
      const yazma = await supabase
        .from("attendance")
        .upsert(satirlar, { onConflict: "session_id,student_id" });

      if (yazma.error) return yazma;

      return supabase.from("sessions").update({ saved: true }).eq("id", sessionId);
    });
  }

  const value = {
    classes,
    loading,
    pending,
    error,
    reload,
    clearError: () => setError(""),
    getClass,
    addClass,
    deleteClass,
    addStudent,
    deleteStudent,
    addSession,
    deleteSession,
    saveSession,
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