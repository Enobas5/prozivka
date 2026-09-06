import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import Header from "./components/Header.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ClassPage from "./pages/ClassPage.jsx";

function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="loading">Yükleniyor…</p>;
  }
  if (!user) {
    return <Navigate to="/giris" replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <p className="loading">Yükleniyor…</p>;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppShell() {
  return (
    <>
      <Header />

      <main className="container">
        <Routes>
          <Route
            path="/giris"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sinif/:classId"
            element={
              <ProtectedRoute>
                <ClassPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>prozivka · yoklama sistemi</p>
      </footer>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <AppShell />
      </DataProvider>
    </AuthProvider>
  );
}