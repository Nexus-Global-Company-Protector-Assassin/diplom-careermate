import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, ParsedProfileDto } from '@/shared/api';

/**
 * Hook to upload a PDF or DOCX file to the ML Agent.
 * The agent extracts structured profile data and returns ParsedProfileDto.
 */
export const useUploadResume = () => {
    return useMutation<ParsedProfileDto, Error, File>({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            // NOTE: We cannot use api.post here because it forces JSON Content-Type.
            // multipart/form-data requires the browser to set the boundary automatically.
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Calls the ML Agent directly via backend proxy or directly
            // Backend does NOT yet proxy file uploads, so we talk to Agent directly on :3002
            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3002';
            const response = await fetch(`${agentUrl}/ai/upload-resume`, {
                method: 'POST',
                headers,
                body: formData,
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка загрузки файла');
            }

            const json = await response.json();
            return json.data as ParsedProfileDto;
        },
    });
};
