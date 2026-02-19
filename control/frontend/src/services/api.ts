// API client for communicating with Express backend

import axios from 'axios';
import type { GenerateRequest, GenerateResponse, Sketch, Style, FeedbackRequest, FeedbackResponse, SummarizeRequest, SummarizeResponse, GenerationsResponse, RefineRequest } from '../types';

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

/**
 * Stream sketch generation via SSE. Yields individual images as they complete.
 */
export async function generateSketchesStream(
  request: GenerateRequest,
  callbacks: {
    onProgress: (stage: string, data: Record<string, unknown>) => void;
    onImage: (index: number, sketch: Sketch) => void;
    onComplete: (data: { timestamp: string; totalImages: number; successCount: number; styleId: string }) => void;
    onError: (message: string) => void;
  },
  signal?: AbortSignal
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/generate-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok || !response.body) {
    callbacks.onError('Failed to connect to generation service');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Parse SSE events from buffer
    const parts = buffer.split('\n\n');
    buffer = parts.pop() || ''; // Keep incomplete event

    for (const part of parts) {
      if (!part.trim()) continue;
      const lines = part.split('\n');
      let eventType = '';
      let eventData = '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          eventType = line.slice(7);
        } else if (line.startsWith('data: ')) {
          eventData = line.slice(6);
        }
      }

      if (!eventType || !eventData) continue;

      try {
        const data = JSON.parse(eventData);
        switch (eventType) {
          case 'progress':
            callbacks.onProgress(data.stage, data);
            break;
          case 'image':
            if (data.sketch) {
              callbacks.onImage(data.index, data.sketch as Sketch);
            } else {
              // Image failed — still notify with error
              callbacks.onImage(data.index, {
                id: `error_${data.index}`,
                imagePath: null,
                resolution: [1024, 1024],
                error: data.error || 'Generation failed',
                metadata: {
                  promptSpec: { intent: '', refinedIntent: '', negativeConstraints: [] },
                  referenceImages: [],
                  retrievalScores: [],
                },
              } as Sketch);
            }
            break;
          case 'complete':
            callbacks.onComplete(data);
            break;
          case 'error':
            callbacks.onError(data.message);
            break;
        }
      } catch {
        // Ignore unparseable events
      }
    }
  }
}
