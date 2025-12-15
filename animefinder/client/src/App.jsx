import React from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import MainPage from "./pages/MainPage.jsx";
import SubPage from "./pages/SubPage.jsx";
import AnimeFinderPage from "./pages/AnimeFinderPage.jsx";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";

function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function Layout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="app">
      <header className="app-header">
        <Link to="/" className="logo">
          AnimeFinder
        </Link>
        {user && (
          <nav className="nav">
            <Link to="/main">Main</Link>
            <Link to="/animefinder">Anime Finder</Link>
            <Link to="/sub">Subscriptions</Link>
            <button onClick={logout} className="btn-ghost">
              Logout
            </button>
          </nav>
        )}
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/main" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/main"
            element={
              <RequireAuth>
                <MainPage />
              </RequireAuth>
            }
          />
          <Route
            path="/sub"
            element={
              <RequireAuth>
                <SubPage />
              </RequireAuth>
            }
          />
          <Route
            path="/animefinder"
            element={
              <RequireAuth>
                <AnimeFinderPage />
              </RequireAuth>
            }
          />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}


