import { useMutation } from '@tanstack/react-query';
import { API_BASE_URL, ChatMessage, ChatResponseDto, ParsedProfileDto } from '@/shared/api';

interface ChatRequest {
    messages: ChatMessage[];
    profileData?: ParsedProfileDto;
}

/**
 * Hook for interacting with the ReAct AI Agent in a conversational manner.
 * The agent may return either a final result or a list of clarifying questions.
 */
export const useAiChat = () => {
    return useMutation<ChatResponseDto, Error, ChatRequest>({
        mutationFn: async (request: ChatRequest) => {
            const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:3003';
            const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

            const response = await fetch(`${agentUrl}/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(err.message || 'Ошибка чата с агентом');
            }

            const json = await response.json();
            return json.result as ChatResponseDto;
        },
    });
};
