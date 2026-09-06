import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

function kullaniciyaCevir(supabaseUser) {
  if (!supabaseUser) return null;
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    username: metadata.username || supabaseUser.email.split("@")[0],
  };
}

function hatayiCevir(message) {
  const m = (message || "").toLowerCase();

  if (m.includes("invalid login credentials")) {
    return "E-posta veya şifre hatalı.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Bu e-posta ile zaten bir hesap var.";
  }
  if (m.includes("password should be at least")) {
    return "Şifre en az 6 karakter olmalı.";
  }
  if (m.includes("email not confirmed")) {
    return "E-posta henüz doğrulanmamış.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "Geçerli bir e-posta adresi gir.";
  }
  if (m.includes("new password should be different")) {
    return "Yeni şifre eskisiyle aynı olamaz.";
  }
  if (m.includes("auth session missing") || m.includes("session_not_found")) {
    return "Sıfırlama bağlantısı geçersiz veya süresi dolmuş. Yeni bir bağlantı iste.";
  }
  if (m.includes("for security purposes") || m.includes("rate limit")) {
    return "Çok sık denedin. Bir dakika bekleyip tekrar dene.";
  }
  if (m.includes("failed to fetch") || m.includes("network")) {
    return "Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.";
  }
  return message || "Beklenmeyen bir hata oluştu.";
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let iptal = false;

    supabase.auth.getSession().then(({ data }) => {
      if (iptal) return;
      setUser(kullaniciyaCevir(data.session?.user));
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Sifre sifirlama baglantisiyla gelindiginde isaretle.
      if (event === "PASSWORD_RECOVERY") {
        setRecovering(true);
      }
      setUser(kullaniciyaCevir(session?.user));
      setReady(true);
    });

    return () => {
      iptal = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function register(email, password, username) {
    const temizAd = username.trim();

    if (temizAd.length < 3) {
      return { ok: false, error: "Görünen ad en az 3 karakter olmalı." };
    }
    if (password.length < 6) {
      return { ok: false, error: "Şifre en az 6 karakter olmalı." };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: temizAd } },
    });

    if (error) {
      return { ok: false, error: hatayiCevir(error.message) };
    }
    if (!data.session) {
      return {
        ok: false,
        error: "Hesap oluşturuldu ama oturum açılmadı. E-posta doğrulaması gerekiyor olabilir.",
      };
    }

    return { ok: true };
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, error: hatayiCevir(error.message) };
    }
    return { ok: true };
  }

  // Sifirlama baglantisi gonderir.
  async function requestPasswordReset(email) {
    const temiz = email.trim();

    if (!temiz) {
      return { ok: false, error: "E-posta adresini yaz." };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(temiz, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });

    if (error) {
      return { ok: false, error: hatayiCevir(error.message) };
    }
    return { ok: true };
  }

  // Sifirlama baglantisiyla gelindikten sonra yeni sifreyi yazar.
  async function updatePassword(newPassword) {
    if (newPassword.length < 6) {
      return { ok: false, error: "Şifre en az 6 karakter olmalı." };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      return { ok: false, error: hatayiCevir(error.message) };
    }

    setRecovering(false);
    return { ok: true };
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setRecovering(false);
  }

  const value = {
    user,
    ready,
    recovering,
    register,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth yalnızca AuthProvider içinde kullanılabilir.");
  }
  return context;
}