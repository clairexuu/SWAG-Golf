// API client for communicating with Express backend

import axios from 'axios';
import type { GenerateRequest, GenerateResponse, Style, FeedbackRequest, FeedbackResponse, SummarizeRequest, SummarizeResponse, GenerationsResponse, RefineRequest } from '../types';

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

export async function generateSketches(request: GenerateRequest, signal?: AbortSignal): Promise<GenerateResponse> {
  const response = await apiClient.post<GenerateResponse>('/generate', request, { signal });
  return response.data;
}

export async function healthCheck(): Promise<{ status: string; pythonBackend: string; version: string; mode: string }> {
  const response = await apiClient.get('/health');
  return response.data;
}

export async function createStyle(formData: FormData): Promise<{ success: boolean }> {
  const response = await apiClient.post('/styles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function addImagesToStyle(styleId: string, formData: FormData): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/styles/${styleId}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function updateStyle(
  styleId: string,
  updates: { name?: string; description?: string; visual_rules?: Record<string, string> }
): Promise<{ success: boolean }> {
  const response = await apiClient.put(`/styles/${styleId}`, updates);
  return response.data;
}

export async function deleteStyle(styleId: string): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/styles/${styleId}`);
  return response.data;
}

export async function deleteImagesFromStyle(
  styleId: string,
  filenames: string[]
): Promise<{ success: boolean; deleted: number }> {
  const response = await apiClient.delete(`/styles/${styleId}/images`, {
    data: { filenames },
  });
  return response.data;
}

export function getReferenceImageUrl(filename: string): string {
  return `${API_BASE_URL}/reference-images/${filename}`;
}

export async function submitFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  const response = await apiClient.post<FeedbackResponse>('/feedback', request);
  return response.data;
}

export async function summarizeFeedback(request: SummarizeRequest): Promise<SummarizeResponse> {
  const response = await apiClient.post<SummarizeResponse>('/feedback/summarize', request);
  return response.data;
}

export async function getGenerations(styleId?: string): Promise<GenerationsResponse> {
  const params = styleId ? { params: { styleId } } : {};
  const response = await apiClient.get<GenerationsResponse>('/generations', params);
  return response.data;
}

export async function refineSketches(request: RefineRequest, signal?: AbortSignal): Promise<GenerateResponse> {
  const response = await apiClient.post<GenerateResponse>('/refine', request, { signal });
  return response.data;
}

export async function confirmGeneration(dirName: string): Promise<void> {
  await apiClient.post(`/generations/${dirName}/confirm`);
}

export function getGeneratedImageUrl(dirName: string, filename: string): string {
  return `${API_BASE_URL}/generated/${dirName}/${filename}`;
}
