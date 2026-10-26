import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** One pending request per dialog. Closing cancels its callbacks as well as its network read. */
export default function useDialogRequest(open: boolean, fallbackFocus?: RefObject<HTMLElement>) {
    const active = useRef<AbortController | null>(null);
    const requestFocus = useRef<HTMLElement | null>(null);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState(false);
    const cancel = useCallback(() => {
        requestFocus.current = null;
        active.current?.abort();
        active.current = null;
        setPending(false);
        setError(false);
    }, []);
    useEffect(() => {
        if (!open || pending) return;
        const opener = requestFocus.current;
        requestFocus.current = null;
        const focused = document.activeElement;
        const target = opener?.isConnected ? opener : fallbackFocus?.current;
        // Restore only focus lost to a container, preserving another focused control.
        if (opener && target?.isConnected && focused !== target && focused?.contains(target)) target.focus();
    }, [open, pending, fallbackFocus]);
    useEffect(() => {
        if (!open) cancel();
        return () => {
            requestFocus.current = null;
            active.current?.abort();
            active.current = null;
        };
    }, [open, cancel]);
    const run = async <Result>(request: (signal: AbortSignal) => Promise<Result>, success: (result: Result) => void) => {
        if (active.current) return;
        const opener = document.activeElement;
        requestFocus.current = opener instanceof HTMLElement ? opener : null;
        const controller = new AbortController();
        active.current = controller;
        setPending(true);
        setError(false);
        try {
            const result = await request(controller.signal);
            if (!controller.signal.aborted) success(result);
        } catch {
            if (!controller.signal.aborted) setError(true);
        } finally {
            if (active.current === controller) {
                active.current = null;
                setPending(false);
            }
        }
    };
    return { pending, error, run, cancel };
}
