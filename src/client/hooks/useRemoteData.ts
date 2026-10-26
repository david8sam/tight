import { useEffect, useState } from 'react';

type Resource<Data> = { kind: 'loading' } | { kind: 'loaded'; data: Data } | { kind: 'error' };

/** The caller supplies a stable loader. Replacing it cancels the previous read. */
export default function useRemoteData<Data>(load: (signal: AbortSignal) => Promise<Data>) {
    const [resource, setResource] = useState<Resource<Data>>({ kind: 'loading' });
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        const controller = new AbortController();
        setResource({ kind: 'loading' });
        load(controller.signal).then(data => {
            if (!controller.signal.aborted) setResource({ kind: 'loaded', data });
        }).catch(() => {
            if (!controller.signal.aborted) setResource({ kind: 'error' });
        });
        return () => controller.abort();
    }, [load, attempt]);
    return { resource, retry: () => setAttempt(value => value + 1) };
}
