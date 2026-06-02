import React, { useState } from "react";

import api from "../api";

const colors = [
  { hex: "#ffb3b3", name: "Rojo", ring: "#ff6b6b" },
  { hex: "#ffe4a3", name: "Amarillo", ring: "#ffc107" },
  { hex: "#a8e6cf", name: "Verde", ring: "#4caf50" },
  { hex: "#a3c9ff", name: "Azul", ring: "#2196f3" }
];

export default function AddMedicationModal({ isOpen, onClose, onSuccess }) {
  const [form, setForm] = useState({
    compartimento: 1,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };

    // Recalcular fecha_fin automáticamente para tratamientos diarios
    if (
      (name === "repeticion" || name === "fecha_inicio" || name === "stock" || name === "dosis") &&
      (name === "repeticion" ? value === "DIARIO" : updated.repeticion === "DIARIO")
    ) {
      const dias = Math.floor((parseInt(updated.stock || 0, 10)) / (parseInt(updated.dosis || 0, 10) || 1));

      if (updated.fecha_inicio && dias > 0) {
        const start = new Date(updated.fecha_inicio + "T00:00:00");
        const fin = new Date(start);
        fin.setDate(start.getDate() + dias - 1);
        const year = fin.getFullYear();
        const month = String(fin.getMonth() + 1).padStart(2, "0");
        const day = String(fin.getDate()).padStart(2, "0");
        updated.fecha_fin = `${year}-${month}-${day}`;
      }
    }

    setForm(updated);
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

    api.post("tratamientos/", cleanForm)
      .then(() => {
        // Reset form
        setForm({
          compartimento: 1,
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
        onSuccess();
      })
      .catch((err) => {
        console.error("Error del backend:", err.response?.data);
        alert("Error: " + JSON.stringify(err.response?.data));
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 flex items-start justify-center z-50 overflow-y-auto">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
          <button
            onClick={onClose}
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

      {/* Form */}
      <div className="w-full max-w-xl mt-20 md:mt-24 mb-8 px-4">
        <form onSubmit={handleSubmit} className="bg-white p-5 md:p-8 rounded-2xl shadow-2xl space-y-5 md:space-y-6 border border-emerald-100">
          {/* Header del formulario */}
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700">
              Agregar Medicamento
            </h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">
              Configura las pastillas, dosis y horarios
            </p>
          </div>

          {/* Compartimento */}
          <div>
            <label className="block font-semibold text-gray-700 mb-3">
              Compartimento
            </label>
            <div className="grid grid-cols-4 gap-2 md:gap-3">
              {colors.map((color, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setForm({ ...form, compartimento: index + 1 })}
                  className={`h-16 md:h-20 rounded-xl transition-all ${form.compartimento === index + 1
                      ? 'ring-4 scale-105'
                      : 'ring-2 ring-gray-200 hover:scale-105'
                    }`}
                  style={{
                    backgroundColor: color.hex,
                    ...(form.compartimento === index + 1 && {
                      '--tw-ring-color': color.ring,
                      borderColor: color.ring
                    })
                  }}
                >
                  <div className="text-white font-bold text-lg">
                    {index + 1}
                  </div>
                  {form.compartimento === index + 1 && (
                    <svg className="w-6 h-6 md:w-8 md:h-8 mx-auto text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
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

          {/* Dosis y Stock */}
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm md:text-base">
                Dosis (por toma)
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
            <div>
              <label className="block font-semibold text-gray-700 mb-1 text-sm md:text-base">
                Stock (pastillas)
              </label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400 outline-none text-base"
                min="0"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-3 md:-mt-4">
            El stock disminuirá automáticamente en cada toma
          </p>

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

          {/* Condicionales según repetición */}
          {form.repeticion === "CADA_X_HORAS" && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Intervalo en horas
              </label>
              <input
                type="number"
                name="intervalo_horas"
                placeholder="Ej: 8"
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
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Día de la semana
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
              </div>
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
            </div>
          )}

          {/* Fechas opcionales - Responsive */}
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
                readOnly={form.repeticion === "DIARIO"}
              />
              {form.repeticion === "DIARIO" && (
                <p className="text-xs text-gray-500 mt-1">
                  Calculada automáticamente según stock, dosis y fecha de inicio.
                </p>
              )}
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