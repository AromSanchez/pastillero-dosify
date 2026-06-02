import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Ajustes() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, updateUser, loading: authLoading } = useAuth();
  const [notificaciones, setNotificaciones] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estados para edición de perfil
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nombreTemp, setNombreTemp] = useState("");
  const [guardandoNombre, setGuardandoNombre] = useState(false);

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [successPassword, setSuccessPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  // Cargar preferencias iniciales desde localStorage (solo notificaciones)
  useEffect(() => {
    const notif = localStorage.getItem("notificaciones") ?? "true";
    setNotificaciones(notif === "true");
  }, []);

  // 🔒 Redirigir si no está autenticado, esperando a que termine de cargar el auth
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

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

  const toggleNotificaciones = async () => {
    const nuevo = !notificaciones;
    setNotificaciones(nuevo);
    localStorage.setItem("notificaciones", nuevo ? "true" : "false");

    if (nuevo && "Notification" in window) {
      Notification.requestPermission().then((perm) => {
        if (perm !== "granted") {
          alert("No se otorgaron permisos de notificación. No se podrán mostrar recordatorios.");
        }
      });
    }

    try {
      const token = localStorage.getItem("token");
      await api.post(
        "auth/notification-settings/",
        { telegram_activo: nuevo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error al actualizar preferencias de notificación:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const displayName = user?.name || user?.username || user?.email?.split("@")[0] || "Usuario";
  const displayEmail = user?.email || "correo@ejemplo.com";

  const closeSidebar = () => setIsSidebarOpen(false);

  // Función para guardar el nombre editado
  const handleGuardarNombre = async () => {
    if (!nombreTemp.trim()) {
      alert("El nombre no puede estar vacío");
      return;
    }

    setGuardandoNombre(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.put(
        "auth/profile/",
        { name: nombreTemp },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("✅ Perfil actualizado:", response.data);

      // Actualizar el contexto con el nuevo nombre
      if (response.data.user) {
        updateUser(response.data.user);
      } else {
        updateUser({ name: nombreTemp });
      }

      setEditandoNombre(false);
      alert("Nombre actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar nombre:", error);
      alert(error.response?.data?.error || "Error al actualizar el nombre. Intenta nuevamente.");
    } finally {
      setGuardandoNombre(false);
    }
  };

  // Función para cambiar contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword("");
    setSuccessPassword("");

    // Validaciones
    if (!passwordData.currentPassword) {
      setErrorPassword("Debes ingresar tu contraseña actual");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorPassword("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorPassword("Las contraseñas nuevas no coinciden");
      return;
    }

    setCambiandoPassword(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.post(
        "auth/change-password/",
        {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      console.log("✅ Contraseña cambiada:", response.data);

      // Si el backend devuelve un nuevo token, actualizarlo
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      setSuccessPassword("Contraseña cambiada exitosamente");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      // Opcional: cerrar sesión después de cambiar contraseña
      setTimeout(() => {
        alert("Contraseña actualizada. Por favor inicia sesión nuevamente.");
        handleLogout();
      }, 2000);
    } catch (error) {
      console.error("Error al cambiar contraseña:", error);
      if (error.response?.status === 400) {
        setErrorPassword(error.response?.data?.error || "Contraseña actual incorrecta");
      } else {
        setErrorPassword(error.response?.data?.error || "Error al cambiar la contraseña");
      }
    } finally {
      setCambiandoPassword(false);
    }
  };

  // Si no está autenticado, no renderizar nada (está redirigiendo)
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

        {/* Sidebar Header */}
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
          <p className="text-emerald-200 text-sm ml-1">Gestión de medicamentos</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          <button onClick={() => { navigate("/dashboard"); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="font-medium">Panel Principal</span>
          </button>

          <button onClick={() => { navigate("/historial"); closeSidebar(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">Historial</span>
          </button>

          <button onClick={() => navigate("/ajustes")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold">Ajustes</span>
          </button>
        </nav>

        {/* User Section */}
        <div className="mt-auto space-y-3">
          <div className="bg-emerald-600 rounded-xl p-4">
            <p className="text-sm text-emerald-200 mb-1">Usuario</p>
            <p className="font-semibold text-lg truncate">{displayName}</p>
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all font-semibold shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8">
          <div className="max-w-4xl mx-auto">
            {/* Header con botón volver */}
            <div className="mb-6 md:mb-8">
              <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver
              </button>
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900">Ajustes</h2>
            </div>

            {/* Información Personal */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Información Personal</h3>
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {/* Nombre editable */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Nombre</label>
                  {editandoNombre ? (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={nombreTemp}
                        onChange={(e) => setNombreTemp(e.target.value)}
                        className="flex-1 bg-white border-2 border-blue-500 rounded-xl px-4 py-3 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tu nombre"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleGuardarNombre}
                          disabled={guardandoNombre}
                          className="flex-1 sm:flex-none px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                          {guardandoNombre ? "..." : "✓"}
                        </button>
                        <button
                          onClick={() => {
                            setEditandoNombre(false);
                            setNombreTemp("");
                          }}
                          className="flex-1 sm:flex-none px-4 py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold rounded-xl transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 text-gray-800 font-medium">
                        {displayName}
                      </div>
                      <button
                        onClick={() => {
                          setEditandoNombre(true);
                          setNombreTemp(displayName);
                        }}
                        className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>

                {/* Correo (no editable) */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Correo</label>
                  <div className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800 font-medium break-all">
                    {displayEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Preferencias */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Preferencias</h3>
              <div className="space-y-4">
                {/* Notificaciones */}
                <div className="flex items-center justify-between py-3 md:py-4">
                  <div className="pr-4">
                    <p className="text-base md:text-lg font-semibold text-gray-800">Notificaciones</p>
                    <p className="text-sm text-gray-600">Recibe recordatorios para tomar tus medicamentos</p>
                  </div>
                  <button
                    onClick={toggleNotificaciones}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 items-center rounded-full transition-colors ${notificaciones ? "bg-blue-600" : "bg-gray-300"
                      }`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${notificaciones ? "translate-x-7" : "translate-x-1"
                      }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Cambiar Contraseña */}
            <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8 mb-4 md:mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Cambiar Contraseña</h3>

              {errorPassword && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                  {errorPassword}
                </div>
              )}

              {successPassword && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
                  {successPassword}
                </div>
              )}

              <form onSubmit={handleCambiarPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-base"
                    placeholder="Ingresa tu contraseña actual"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition pr-12 text-base"
                      placeholder="Ingresa tu nueva contraseña"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {mostrarPassword ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-base"
                    placeholder="Confirma tu nueva contraseña"
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={cambiandoPassword}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cambiandoPassword ? "Cambiando contraseña..." : "Cambiar Contraseña"}
                </button>
              </form>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold px-6 py-4 rounded-2xl shadow-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}