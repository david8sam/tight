export function getApiUrl(origin: string, operation: string): string {
    return new URL(`/api${operation}`, origin).href;
}

export function getWebSocketUrl(origin: string): string {
    const url = new URL('/socket', origin);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return url.href;
}
