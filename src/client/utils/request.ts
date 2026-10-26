/** Bound the complete response read, not just the arrival of HTTP headers. */
export async function readResponse<Result>(
    url: string,
    options: RequestInit,
    read: (response: Response) => Promise<Result>,
): Promise<Result> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    const signal = options.signal;
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(abort, 15000);
    try {
        return await read(await fetch(url, { ...options, signal: controller.signal }));
    } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
    }
}
