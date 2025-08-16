import { Api } from './Api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = new Api({
  baseURL: API_BASE_URL
});
