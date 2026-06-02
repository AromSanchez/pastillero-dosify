import React from "react";
import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <img
            src="/logito.png"
            alt="Ícono Dulce Dosis"
            className="w-48 h-48 object-contain drop-shadow-xl"
          />
          <img
            src="/dulce.png"
            alt="Texto Dulce Dosis"
            className="mt-0 w-60 object-contain"
          />
        </div>

        {/* Subtítulo */}
        <p className="text-lg text-gray-600 mb-12 mt-2">
          Tu asistente confiable para gestionar tus medicamentos diarios
        </p>

        {/* Botones */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/login")}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Iniciar sesión
          </button>

          <button
            onClick={() => navigate("/register")}
            className="w-full bg-white hover:bg-gray-50 text-emerald-600 font-semibold py-4 px-6 rounded-2xl border-2 border-emerald-500 transition-all duration-200 transform hover:scale-105"
          >
            Registrarse
          </button>
        </div>
      </div>
    </div>
  );
}