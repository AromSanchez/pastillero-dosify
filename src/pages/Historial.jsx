import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Historial() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  const [historial, setHistorial] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Utilidad: formatear una fecha a YYYY-MM-DD usando la hora local
  const getFechaLocalStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    // Esperar a que termine de cargar el estado de autenticación
    if (authLoading) return;

    if (!isAuthenticated) {
      navigate("/login", { replace: true });
    } else {
      cargarDatos();
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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [historialRes, tratamientosRes] = await Promise.all([
        api.get("historial/"),
        api.get("tratamientos/")
      ]);

      console.log(" Historial recibido:", historialRes.data);
      console.log(" Tratamientos recibidos:", tratamientosRes.data);

      setHistorial(historialRes.data);
      setTratamientos(tratamientosRes.data);
    } catch (err) {
      console.error("Error al cargar datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayName = user?.name || user?.username || user?.email?.split('@')[0] || "Usuario";

  const closeSidebar = () => setIsSidebarOpen(false);

  // Generar historial completo combinando tratamientos programados con registros reales
  const generarHistorialCompleto = () => {
    const historialCompleto = {};
    // Usar "hoy" sin hora (medianoche local) para comparar solo por día
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 1. Primero, crear entradas para todos los tratamientos programados
    tratamientos.forEach(tratamiento => {
      if (!tratamiento.activo) return;

      const fechaInicio = new Date(tratamiento.fecha_inicio);
      const fechaFin = tratamiento.fecha_fin ? new Date(tratamiento.fecha_fin) : new Date();

      let fechaActual = new Date(fechaInicio);
      // Normalizar a medianoche local para comparar solo fechas
      fechaActual.setHours(0, 0, 0, 0);

      while (fechaActual <= fechaFin && fechaActual <= hoy) {
        // Usar siempre la fecha local (no UTC) para agrupar
        const fechaStr = getFechaLocalStr(fechaActual);

        const diaSemana = fechaActual.getDay();

        // Verificar si corresponde según repetición
        let debeTomar = false;
        if (tratamiento.repeticion === 'DIARIO') debeTomar = true;
        if (tratamiento.repeticion === 'LUNES A VIERNES' && diaSemana >= 1 && diaSemana <= 5) debeTomar = true;
        if (tratamiento.repeticion === 'FINES DE SEMANA' && (diaSemana === 0 || diaSemana === 6)) debeTomar = true;

        if (debeTomar) {
          // Regla importante:
          // - Para días ANTERIORES a hoy, NO creamos entradas "programadas" automáticamente.
          //   Solo se mostrarán si hay un registro real (TOMADA u OMITIDA) desde el backend.
          // - Solo para HOY se crean entradas programadas PENDIENTE,
          //   y solo si NO existe ya un registro real para ese tratamiento y día.
          const esHoy = fechaActual.getTime() === hoy.getTime();

          if (esHoy) {
            // ¿Ya hay un registro real (del backend) para este tratamiento y este día?
            const existeRegistroRealHoy = historial.some((reg) => {
              const fechaReg = new Date(reg.fecha_hora_real);
              const fechaRegStr = getFechaLocalStr(fechaReg);
              const mismoDia = fechaRegStr === fechaStr;

              const coincideTratamiento = reg.tratamiento_id === tratamiento.id;
              const coincideNombre = (reg.nombre_pastilla || '').toLowerCase() === tratamiento.nombre_pastilla.toLowerCase();

              return mismoDia && (coincideTratamiento || coincideNombre);
            });

            if (!existeRegistroRealHoy) {
              if (!historialCompleto[fechaStr]) {
                historialCompleto[fechaStr] = [];
              }

              // Crear una entrada "programada" solo para hoy
              const [hora, minuto] = tratamiento.hora_toma.split(':');
              const fechaHoraToma = new Date(fechaActual);
              fechaHoraToma.setHours(parseInt(hora), parseInt(minuto), 0, 0);

              historialCompleto[fechaStr].push({
                id: `programado-${tratamiento.id}-${fechaStr}`,
                tratamiento_id: tratamiento.id,
                nombre_pastilla: tratamiento.nombre_pastilla,
                fecha_hora_real: fechaHoraToma.toISOString(),
                // Importante: las entradas programadas nunca se marcan como OMITIDA aquí.
                // El estado OMITIDA solo debe provenir de registros reales enviados por el backend.
                estado: 'PENDIENTE',
                esRegistroReal: false,
                compartimento: tratamiento.compartimento
              });
            }
          }
        }

        fechaActual.setDate(fechaActual.getDate() + 1);
      }
    });

    // 2. Sobrescribir con los registros reales del historial
    historial.forEach(registro => {
      console.log(" Procesando registro:", registro);

      const fecha = new Date(registro.fecha_hora_real);
      // Importante: usar la fecha local (no UTC) para evitar adelantarse de día
      const fechaStr = getFechaLocalStr(fecha);

      if (!historialCompleto[fechaStr]) {
        // Si no existe la fecha, crear nueva entrada directamente del historial
        historialCompleto[fechaStr] = [{
          ...registro,
          esRegistroReal: true
        }];
        return;
      }

      // Buscar coincidencia por tratamiento_id
      let encontrado = false;

      for (let i = 0; i < historialCompleto[fechaStr].length; i++) {
        const item = historialCompleto[fechaStr][i];

        // Buscar por tratamiento_id O por nombre de pastilla en el mismo día
        const coincideTratamiento = item.tratamiento_id === registro.tratamiento_id;
        const coincideNombre = item.nombre_pastilla.toLowerCase() === registro.nombre_pastilla.toLowerCase();

        // Verificar si es la misma hora aproximada (dentro de 30 minutos)
        const horaItem = new Date(item.fecha_hora_real);
        const horaRegistro = new Date(registro.fecha_hora_real);
        const diffMinutos = Math.abs(horaItem - horaRegistro) / 1000 / 60;

        console.log(`   Comparando: ${item.nombre_pastilla} vs ${registro.nombre_pastilla}`);
        console.log(`   - Coincide tratamiento: ${coincideTratamiento}`);
        console.log(`   - Coincide nombre: ${coincideNombre}`);
        console.log(`   - Diff minutos: ${diffMinutos}`);

        if ((coincideTratamiento || coincideNombre) && diffMinutos < 180) { // 3 horas de margen
          console.log("   ✅ REEMPLAZANDO con registro real");
          historialCompleto[fechaStr][i] = {
            ...registro,
            esRegistroReal: true
          };
          encontrado = true;
          break;
        }
      }

      // Si no se encontró coincidencia, agregar como nuevo registro
      if (!encontrado) {
        console.log("   ➕ Agregando como nuevo registro");
        historialCompleto[fechaStr].push({
          ...registro,
          esRegistroReal: true
        });
      }
    });

    console.log("📋 Historial completo generado:", historialCompleto);
    return historialCompleto;
  };

  const historialCompleto = generarHistorialCompleto();

  // Agrupar y formatear por fecha
  const agruparPorFecha = () => {
    const grupos = {};

    Object.keys(historialCompleto).sort().reverse().forEach(fechaStr => {
      const fecha = new Date(fechaStr + 'T12:00:00');
      const fechaFormateada = fecha.toLocaleDateString('es-PE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      grupos[fechaFormateada] = historialCompleto[fechaStr].sort((a, b) =>
        new Date(b.fecha_hora_real) - new Date(a.fecha_hora_real)
      );
    });

    return grupos;
  };

  const historialAgrupado = agruparPorFecha();

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

        <nav className="flex-1 space-y-2">
          <button
            onClick={() => { navigate("/dashboard"); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="font-medium">Panel Principal</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">Historial</span>
          </button>

          <button
            onClick={() => { navigate("/ajustes"); closeSidebar(); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-emerald-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Ajustes</span>
          </button>
        </nav>

        <div className="mt-auto space-y-3">
          <div className="bg-emerald-600 rounded-xl p-4">
            <p className="text-sm text-emerald-200 mb-1">Usuario</p>
            <p className="font-semibold text-lg truncate">{displayName}</p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 hover:bg-red-600 transition-all font-semibold shadow-lg"
          >
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
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
                Historial de Medicamentos
              </h2>
              <p className="text-gray-600 text-base md:text-lg">
                Registro de todas tus tomas de medicamentos
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-emerald-700 font-medium">Cargando historial...</p>
                </div>
              </div>
            ) : Object.keys(historialAgrupado).length === 0 ? (
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-8 md:p-12">
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                    <svg className="w-8 h-8 md:w-10 md:h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                    Sin historial aún
                  </h3>
                  <p className="text-gray-600">
                    Aquí aparecerán los registros de tus medicamentos
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {Object.entries(historialAgrupado).map(([fecha, items]) => (
                  <div key={fecha} className="bg-white rounded-2xl md:rounded-3xl shadow-lg p-4 md:p-6">
                    <h3 className="text-lg md:text-xl font-bold text-emerald-700 mb-4 capitalize">
                      {fecha}
                    </h3>

                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border-2 gap-3 ${item.estado === 'TOMADA'
                              ? 'bg-emerald-50 border-emerald-200'
                              : item.estado === 'PENDIENTE'
                                ? 'bg-gray-50 border-gray-200'
                                : 'bg-red-50 border-red-200'
                            }`}
                        >
                          <div className="flex items-center gap-3 md:gap-4">
                            {item.estado === 'TOMADA' ? (
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            ) : item.estado === 'PENDIENTE' ? (
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            ) : (
                              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}

                            <div>
                              <p className="font-bold text-base md:text-lg text-gray-900">{item.nombre_pastilla}</p>
                              <p className="text-sm text-gray-600">
                                {new Date(item.fecha_hora_real).toLocaleTimeString('es-PE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <span className={`inline-block px-3 py-1.5 md:px-4 md:py-2 rounded-lg font-semibold text-sm md:text-base ${item.estado === 'TOMADA'
                                ? 'bg-emerald-500 text-white'
                                : item.estado === 'PENDIENTE'
                                  ? 'bg-gray-400 text-white'
                                  : 'bg-red-500 text-white'
                              }`}>
                              {item.estado === 'TOMADA' ? 'Tomada' : item.estado === 'PENDIENTE' ? 'Pendiente' : 'Omitida'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}