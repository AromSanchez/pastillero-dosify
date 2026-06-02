import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";

export default function EditarCompartimento() {
  const { id, compartimento } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    compartimento: compartimento ? parseInt(compartimento) : 1,
    nombre_pastilla: "",
    dosis: 1,
    stock: 0,
    repeticion: "DIARIO",
    intervalo_horas: "",
    hora_toma: "",
    dia_semana: "",
    fecha_inicio: "",
    fecha_fin: "",
    activo: true,
  });

  // Calcula fecha_fin automáticamente para repetición DIARIO
  const calcularFechaFinAuto = (formData) => {
    try {
      if (formData.repeticion !== "DIARIO") return formData.fecha_fin;
      if (!formData.fecha_inicio) return formData.fecha_fin;

      const stock = parseInt(formData.stock, 10);
      const dosis = parseInt(formData.dosis, 10);
      if (isNaN(stock) || isNaN(dosis) || dosis <= 0) return formData.fecha_fin;

      const dias = Math.floor(stock / dosis);
      if (dias <= 0) return formData.fecha_fin;

      const inicio = new Date(formData.fecha_inicio);
      if (isNaN(inicio.getTime())) return formData.fecha_fin;

      const fin = new Date(inicio);
      // Ejemplo: 10 pastillas, dosis 1, fecha_inicio 01 → dura 10 días (01 al 10)
      fin.setDate(fin.getDate() + dias - 1);

      const year = fin.getFullYear();
      const month = String(fin.getMonth() + 1).padStart(2, "0");
      const day = String(fin.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return formData.fecha_fin;
    }
  };

  useEffect(() => {
    if (id && !compartimento) {
      api.get(`tratamientos/${id}/`).then((res) => setForm(res.data));
    }
  }, [id, compartimento]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...form, [name]: value };

    // Recalcular fecha_fin automáticamente para tratamientos DIARIO
    if (newForm.repeticion === "DIARIO" && ["stock", "dosis", "fecha_inicio", "repeticion"].includes(name)) {
      const autoFin = calcularFechaFinAuto(newForm);
      if (autoFin) {
        newForm.fecha_fin = autoFin;
      }
    }

    setForm(newForm);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanForm = { ...form };

    // Convertir strings vacíos a null
    Object.keys(cleanForm).forEach((key) => {
      if (cleanForm[key] === "") {
        cleanForm[key] = null;
      }
    });

    // Eliminar campos que no correspondan según la repetición
    if (form.repeticion === "DIARIO") {
      cleanForm.intervalo_horas = null;
      cleanForm.dia_semana = null;
    }
    if (form.repeticion === "CADA_X_HORAS") {
      cleanForm.hora_toma = null;
      cleanForm.dia_semana = null;
    }
    if (form.repeticion === "SEMANAL") {
      cleanForm.intervalo_horas = null;
    }

    const request = id && !compartimento
      ? api.put(`tratamientos/${id}/`, cleanForm)
      : api.post("tratamientos/", cleanForm);

    request
      .then(() => navigate("/dashboard"))
      .catch((err) => {
        console.error("Error del backend:", err.response?.data);
        alert("Error: " + JSON.stringify(err.response?.data));
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header con botón de regreso - FIJO */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Volver al Dashboard</span>
            <span className="sm:hidden">Volver</span>
          </button>
          <div className="flex-1" />
          <div className="flex items-center justify-center">
            <img
              src="/dashboard.png"
              alt="Logo"
              className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Formulario con padding-top para compensar el header fijo */}
      <div className="flex items-center justify-center px-4 py-6 md:py-8 pt-20 md:pt-28">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-5 md:p-8 rounded-2xl shadow-2xl w-full max-w-xl space-y-5 md:space-y-6 border border-emerald-100"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700">
              Compartimento {form.compartimento}
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Configura las pastillas, dosis y horarios
            </p>
          </div>

          {/* Nombre pastilla */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Nombre de la pastilla
            </label>
            <input
              type="text"
              name="nombre_pastilla"
              placeholder="Ej: Paracetamol"
              value={form.nombre_pastilla}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              required
            />
          </div>

          {/* Dosis */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Dosis (cantidad por toma)
            </label>
            <input
              type="number"
              name="dosis"
              value={form.dosis}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              min="1"
              required
            />
          </div>

          {/* Stock */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Stock (número de pastillas)
            </label>
            <input
              type="number"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              El stock disminuirá automáticamente en cada toma
            </p>
          </div>

          {/* Repetición */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Repetición
            </label>
            <select
              name="repeticion"
              value={form.repeticion}
              onChange={handleChange}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-white text-base"
            >
              <option value="DIARIO">Diario</option>
              <option value="CADA_X_HORAS">Cada X horas</option>
              <option value="SEMANAL">Semanal</option>
            </select>
          </div>

          {/* Condicionales */}
          {form.repeticion === "CADA_X_HORAS" && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Intervalo en horas
              </label>
              <input
                type="number"
                name="intervalo_horas"
                placeholder="Ej: cada 8 horas"
                value={form.intervalo_horas}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
                min="1"
              />
            </div>
          )}

          {form.repeticion === "DIARIO" && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Hora de la toma
              </label>
              <input
                type="time"
                name="hora_toma"
                value={form.hora_toma}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              />
            </div>
          )}

          {form.repeticion === "SEMANAL" && (
            <div className="space-y-3 md:space-y-2">
              <label className="block font-semibold text-gray-700 mb-1">
                Día y hora
              </label>
              <select
                name="dia_semana"
                value={form.dia_semana}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none bg-white text-base"
              >
                <option value="">Selecciona un día</option>
                <option value="0">Lunes</option>
                <option value="1">Martes</option>
                <option value="2">Miércoles</option>
                <option value="3">Jueves</option>
                <option value="4">Viernes</option>
                <option value="5">Sábado</option>
                <option value="6">Domingo</option>
              </select>
              <input
                type="time"
                name="hora_toma"
                value={form.hora_toma}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              />
            </div>
          )}

          {/* Fechas - Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                name="fecha_inicio"
                value={form.fecha_inicio}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                name="fecha_fin"
                value={form.fecha_fin}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 text-white py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-md text-base"
          >
            Guardar configuración
          </button>
        </form>
      </div>
    </div>
  );
}