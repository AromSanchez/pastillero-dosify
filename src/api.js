import axios from "axios";

const api = axios.create({
  baseURL: "https://pastillero-backend-ydbs.onrender.com/api/",
  headers: {
    'Content-Type': 'application/json',
  },
});


// Interceptor para agregar el token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (no autorizado), podrías redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // Opcional
    }
    return Promise.reject(error);
  }
);

export default api;
