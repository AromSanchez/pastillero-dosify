import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Generar username automático sin espacios
      const autoUsername = formData.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")       // reemplazar espacios por _
        .replace(/[^a-z0-9_.-]/g, "") // eliminar caracteres no válidos
        .substring(0, 20);           // evitar exceder el límite

      const registerData = {
        username: autoUsername,     // <── CORREGIDO
        name: formData.name,
        email: formData.email,
        password: formData.password
      };

      console.log("📤 Enviando registro:", registerData);

      const response = await api.post("auth/register/", registerData);

      console.log("✅ Respuesta del servidor:", response.data);

      if (response.data.token && response.data.user) {
        localStorage.setItem("token", response.data.token);
        login(response.data.user);
        navigate("/dashboard");
      } else if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        const user = {
          name: formData.name,
          email: formData.email,
          id: response.data.id || response.data.user_id
        };
        login(user);
        navigate("/dashboard");
      } else {
        alert("Cuenta creada exitosamente. Ahora inicia sesión.");
        navigate("/login");
      }

    } catch (err) {
      console.error("❌ Error completo:", err);
      console.error("❌ Respuesta del error:", err.response?.data);

      if (err.response?.data) {
        const e = err.response.data;

        if (e.username) setError(e.username[0] || e.username);
        else if (e.email) setError(e.email[0] || e.email);
        else if (e.password) setError(e.password[0] || e.password);
        else if (e.name) setError(e.name[0] || e.name);
        else if (e.message) setError(e.message);
        else setError(JSON.stringify(e));
      } else {
        setError("No se pudo conectar con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img
              src="/logito.png"
              alt="Logo Dulce Dosis"
              className="w-28 h-28 object-contain drop-shadow-xl"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="text-gray-600 mt-2">Únete a Dulce Dosis</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar contraseña
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Inicia sesión
            </button>
          </p>

          <button
            onClick={() => navigate("/")}
            className="text-gray-500 hover:text-gray-700 font-medium text-sm"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}