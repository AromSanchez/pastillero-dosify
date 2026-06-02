import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Cargar credenciales recordadas (si existen)
  useEffect(() => {
    const savedRemember = localStorage.getItem("rememberMe") === "true";
    const savedCreds = localStorage.getItem("rememberedCredentials");

    if (savedRemember && savedCreds) {
      try {
        const { email, password } = JSON.parse(savedCreds);
        setFormData({ email: email || "", password: password || "" });
        setRememberMe(true);
      } catch (e) {
        console.error("Error al leer credenciales recordadas:", e);
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("rememberedCredentials");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Llamada a tu API de login
      const response = await api.post("auth/login/", {
        email: formData.email,
        password: formData.password
      });
      
      console.log("✅ Respuesta del login:", response.data);
      
      // Guardar token y datos del usuario
      const { token, user } = response.data;
      
      if (token && user) {
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem(
            "rememberedCredentials",
            JSON.stringify({ email: formData.email, password: formData.password })
          );
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedCredentials");
        }
        login(user); // Guarda el usuario en el contexto
        navigate("/dashboard");
      } else if (token) {
        // Si solo viene token, crear usuario básico
        localStorage.setItem("token", token);
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem(
            "rememberedCredentials",
            JSON.stringify({ email: formData.email, password: formData.password })
          );
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("rememberedCredentials");
        }
        const basicUser = {
          email: formData.email,
          name: response.data.name || response.data.username || formData.email.split('@')[0],
          id: response.data.id || response.data.user_id
        };
        login(basicUser);
        navigate("/dashboard");
      } else {
        setError("Respuesta del servidor incorrecta");
      }
    } catch (err) {
      console.error("❌ Error de login:", err);
      if (err.response?.status === 401) {
        setError("Credenciales incorrectas");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Error al iniciar sesión. Intenta nuevamente.");
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
          <h2 className="text-3xl font-bold text-gray-900">Iniciar sesión</h2>
          <p className="text-gray-600 mt-2">Bienvenido de vuelta a Dulce Dosis</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Recordarme</span>
            </label>

            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <p className="text-gray-600">
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Regístrate aquí
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