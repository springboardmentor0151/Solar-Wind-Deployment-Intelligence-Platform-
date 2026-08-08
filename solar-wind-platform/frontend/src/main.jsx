import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Set axios defaults from environment variable or fallback to port 8001
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

// Request Interceptor
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor for Auto Token Refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axios.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  const originalRequest = error.config;
  
  if (error.response && error.response.status === 401 && !originalRequest._retry) {
    if (originalRequest.url.includes('/auth/refresh') || originalRequest.url.includes('/auth/login')) {
      return Promise.reject(error);
    }
    
    if (isRefreshing) {
      return new Promise(function(resolve, reject) {
        failedQueue.push({resolve, reject})
      }).then(token => {
        originalRequest.headers['Authorization'] = 'Bearer ' + token;
        return axios(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    const expiredToken = localStorage.getItem('token');
    if (expiredToken) {
      try {
        const res = await axios.post('/api/auth/refresh', { token: expiredToken });
        const { access_token } = res.data;
        localStorage.setItem('token', access_token);
        axios.defaults.headers.common['Authorization'] = 'Bearer ' + access_token;
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
        processQueue(null, access_token);
        isRefreshing = false;
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        isRefreshing = false;
        // Clear tokens and redirect only if refresh fails
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }
  }
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider
      clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}
    >
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);