import axios from 'axios';
import { Platform } from 'react-native';

// For Android Emulator, localhost is 10.0.2.2
// For iOS Simulator, it's 127.0.0.1 (localhost)
// For Physical devices, use your computer's IP address (e.g., 192.168.1.x)
const API_PORT = 5001;
const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const BASE_URL = `http://${HOST}:${API_PORT}/api`;
export const IMAGE_BASE_URL = `http://${HOST}:${API_PORT}`;

const api = axios.create({
  baseURL: BASE_URL,
});

export const getRescues = () => api.get('/rescues');
export const getRescue = (id) => api.get(`/rescues/${id}`);
export const createRescue = (formData) => api.post('/rescues', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const updateRescue = (id, data, config) => {
  const isMultipart = data && data.append !== undefined;
  return api.put(`/rescues/${id}`, data, config || (isMultipart ? {
    headers: { 'Content-Type': 'multipart/form-data' },
  } : {}));
};
export const deleteRescue = (id) => api.delete(`/rescues/${id}`);

export default api;
