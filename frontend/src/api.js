import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

api.login = async (credentials) => {
  const payload = {
    email: credentials.username || credentials.email,
    password: credentials.password
  };
  const response = await api.post('/auth/login', payload);
  return response.data;
};

api.createProject = async (projectData) => {
  const response = await api.post('/projects/', projectData);
  return response.data;
};

api.getProjects = async () => {
  const response = await api.get('/projects/');
  return response.data;
};

api.deleteProject = async (projectId) => {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
};

api.changePassword = async (current_password, new_password, token) => {
  const response = await api.post(
    '/auth/change-password',
    { current_password, new_password },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};

export default api;