'use client';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { FileUploadResponse } from '@/types';

export function useFileUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<FileUploadResponse>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  });
}
