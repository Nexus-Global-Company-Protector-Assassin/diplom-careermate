export type ApiErrorKind = 'network' | 'auth' | 'not_found' | 'server' | 'unknown';

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status: number,
        public readonly kind: ApiErrorKind,
    ) {
        super(message);
        this.name = 'ApiError';
    }

    get isRetryable(): boolean {
        return this.kind === 'network' || this.status >= 500;
    }
}

export function classifyError(status: number, message: string): ApiError {
    if (status === 401 || status === 403) {
        return new ApiError(message, status, 'auth');
    }
    if (status === 404) {
        return new ApiError(message, status, 'not_found');
    }
    if (status >= 500) {
        return new ApiError(message, status, 'server');
    }
    return new ApiError(message, status, 'unknown');
}

export function isNetworkError(err: unknown): boolean {
    return err instanceof TypeError && err.message.includes('fetch');
}

export function toastMessageForError(err: unknown): string {
    if (err instanceof ApiError) {
        if (err.kind === 'auth') return 'Необходима авторизация';
        if (err.kind === 'not_found') return 'Ресурс не найден';
        if (err.kind === 'server') return 'Ошибка сервера. Попробуйте позже';
        return err.message || 'Что-то пошло не так';
    }
    if (isNetworkError(err)) return 'Нет соединения с сервером';
    if (err instanceof Error) return err.message;
    return 'Что-то пошло не так';
}
