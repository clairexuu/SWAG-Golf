// API client for communicating with Express backend

import axios from 'axios';
import type { GenerateRequest, GenerateResponse, Style } from '../types';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function getStyles(): Promise<Style[]> {
  const response = await apiClient.get<{ success: boolean; styles: Style[] }>('/styles');
  return response.data.styles;
}

export async function generateSketches(request: GenerateRequest): Promise<GenerateResponse> {
  const response = await apiClient.post<GenerateResponse>('/generate', request);
  return response.data;
}

export async function healthCheck(): Promise<{ status: string; pythonBackend: string; version: string; mode: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}
