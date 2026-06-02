import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import CompartimentoCard from "../components/CompartimentoCard";
import AddMedicationModal from "../components/AddMedicationModal";

export default function Home() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  const [tratamientos, setTratamientos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notificationTimers, setNotificationTimers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Protección de ruta - verificar autenticación
  useEffect(() => {
    // Esperar a que termine de cargar el auth
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Cargar tratamientos cuando esté autenticado
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      loadTratamientos();
    }
  }, [isAuthenticated, authLoading]);

  // Cerrar sidebar cuando cambia el tamaño de pantalla a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadTratamientos = () => {
    setLoading(true);
    api
      .get("tratamientos/")
      .then((res) => {
        setTratamientos(res.data);
        programarNotificaciones(res.data);
      })

      .catch((err) => {
        console.error("Error al cargar tratamientos:", err);
      })
      .finally(() => setLoading(false));
  };

  // Programar notificaciones locales para las tomas de hoy
  const programarNotificaciones = (listaTratamientos) => {
    // Limpiar timers anteriores
    notificationTimers.forEach((id) => clearTimeout(id));

    const notifPref = localStorage.getItem("notificaciones") ?? "true";
    if (notifPref !== "true") {
      setNotificationTimers([]);
      return;
    }

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const now = new Date();
    const hoyStr = now.toISOString().split("T")[0];
    const nuevosTimers = [];

    listaTratamientos.forEach((t) => {
      if (!t.activo || !t.hora_toma || !t.fecha_inicio) return;

      const fechaInicio = new Date(t.fecha_inicio);
      const fechaFin = t.fecha_fin ? new Date(t.fecha_fin) : null;
      const hoyDate = new Date(hoyStr + "T00:00:00");
      if (hoyDate < fechaInicio || (fechaFin && hoyDate > fechaFin)) return;

      const [h, m] = t.hora_toma.split(":");
      const fechaToma = new Date(hoyStr + `T${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`);
      const diffMs = fechaToma.getTime() - now.getTime();
      if (diffMs <= 0) return; // ya pasó

      const id = setTimeout(() => {
        const titulo = "Recordatorio de medicación";
        const cuerpo = `No olvides tomar tu pastilla: ${t.nombre_pastilla}`;

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(titulo, { body: cuerpo });
        }

        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }, diffMs);

      nuevosTimers.push(id);
    });

    setNotificationTimers(nuevosTimers);
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      notificationTimers.forEach((id) => clearTimeout(id));
    };
  }, [notificationTimers]);

  const getTratamiento = (comp) =>
    tratamientos.find((t) => t.compartimento === comp);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const displayName =
    user?.name || user?.username || user?.email?.split("@")[0] || "Usuario";

  const allCompartmentsFilled = [1, 2, 3, 4].every((c) => getTratamiento(c));

  const closeSidebar = () => setIsSidebarOpen(false);

  // Mostrar loading mientras verifica autenticación
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no renderizar nada (ya está redirigiendo)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-emerald-700 text-white p-4 flex items-center justify-between z-30 shadow-lg">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-emerald-600 rounded-lg transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src="/logito.png" alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg">Dulce Dosis</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-72 bg-gradient-to-b from-emerald-700 to-emerald-900 text-white p-6 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Close button for mobile */}
        <button
          onClick={closeSidebar}
          className="md:hidden absolute top-4 right-4 p-2 hover:bg-emerald-600 rounded-lg transition-colors"
          aria-label="Cerrar menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src="/logito.png"
                alt="Logo Dulce Dosis"
                className="w-12 h-12 object-contain drop-shadow-xl"
              />
            </div>
            <h1 className="text-2xl font-bold">Dulce Dosis</h1>
          </div>
          <p className="text-emerald-200 text-sm ml-1">
            Gestión de medicamentos
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <button
            onClick={() => { navigate("/dashboard"); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="font-semibold">Panel Principal</span>
          </button>

          <button
            onClick={() => { navigate("/historial"); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">Historial</span>
          </button>

          <button
            onClick={() => { navigate("/ajustes"); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span className="font-medium">Ajustes</span>
          </button>
        </nav>

        {/* User Section */}
        <div className="mt-auto space-y-3">
          <div className="bg-emerald-600 rounded-xl p-4">
            <p className="text-sm text-emerald-200 mb-1">Usuario</p>
            <p className="font-semibold text-lg truncate">{displayName}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all font-semibold shadow-lg"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                Bienvenido, {displayName}
              </h2>
              <p className="text-gray-600 text-base md:text-lg">
                Gestiona tus medicamentos y horarios
              </p>
            </div>

            {/* Contenido */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-emerald-700 font-medium">Cargando...</p>
                </div>
              </div>
            ) : tratamientos.length === 0 ? (
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-8 md:p-12 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <svg
                    className="w-8 h-8 md:w-10 md:h-10 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                  No hay medicamentos programados
                </h3>
                <p className="text-gray-600 mb-6 md:mb-8">
                  Agrega tu primer medicamento para comenzar
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-5 py-3 md:px-6 md:py-3 rounded-xl shadow-lg transition-all transform hover:scale-105"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Agregar Medicamento
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <h3 className="text-xl md:text-2xl font-bold text-emerald-800">
                    Compartimentos del Pastillero
                  </h3>
                  {!allCompartmentsFilled && (
                    <button
                      onClick={() => setIsModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-4 py-2 rounded-xl shadow-lg transition-all w-full sm:w-auto"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Agregar
                    </button>
                  )}
                </div>

                <section className="space-y-4 md:space-y-6">
                  {[1, 2, 3, 4].map((comp) => (
                    <CompartimentoCard
                      key={comp}
                      compartimento={comp}
                      tratamiento={getTratamiento(comp)}
                      onDelete={loadTratamientos}
                    />
                  ))}
                </section>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal para agregar */}
      <AddMedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadTratamientos();
        }}
      />
    </div>
  );
}