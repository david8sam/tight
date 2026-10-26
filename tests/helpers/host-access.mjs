export function withCookie(cookie, options = {}) {
    const headers = new Headers(options.headers);
    headers.set('cookie', cookie);
    return { ...options, headers };
}
export async function claimHost(origin, logs) {
    const token = logs.match(/#host=([A-Za-z0-9_-]{43})/)?.[1];
    if (!token) throw new Error('Missing host claim URL');
    const response = await globalThis.fetch(`${origin}/api/session/host`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    if (!response.ok) throw new Error('Could not claim test host');
    const cookie = response.headers.get('set-cookie')?.split(';')[0];
    if (!cookie) throw new Error('Missing host session cookie');
    return cookie;
}
