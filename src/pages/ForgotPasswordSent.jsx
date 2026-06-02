import React from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordSent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Revisa tu correo</h2>
        <p className="text-gray-600 text-sm mb-6">
          Si existe una cuenta asociada a ese correo, te enviaremos un enlace para restablecer tu contraseña.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200"
        >
          Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
