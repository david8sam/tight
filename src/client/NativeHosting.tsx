import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { hostingSchema, Hosting } from 'common/hosting';
import { useSession } from './SessionGate';

type HostingState = { kind: 'browser' } | { kind: 'loading' } | { kind: 'failed' } | { kind: 'ready'; value: Hosting };
const NativeHostingContext = createContext<{
    state: HostingState;
    pending: boolean;
    refresh: () => Promise<void>;
    change: (address: string | null) => Promise<void>;
}>({ state: { kind: 'browser' }, pending: false, refresh: async () => {}, change: async () => {} });
export const useNativeHosting = () => useContext(NativeHostingContext);

export default function NativeHosting({ children }: React.PropsWithChildren) {
    const session = useSession();
    const api = session.role === 'host' ? window.tightDesktop : undefined;
    const [state, setState] = useState<HostingState>(api ? { kind: 'loading' } : { kind: 'browser' });
    const [pending, setPending] = useState(false);
    const changing = useRef(false);
    const latest = useRef(0);
    const mounted = useRef(true);
    const refresh = useCallback(async () => {
        if (!api || changing.current) return;
        const request = ++latest.current;
        try {
            const value = hostingSchema.parse(await api.getHosting());
            if (mounted.current && request === latest.current) setState({ kind: 'ready', value });
        } catch {
            if (mounted.current && request === latest.current) setState({ kind: 'failed' });
        }
    }, [api]);
    useEffect(() => {
        mounted.current = true;
        void refresh();
        const focus = () => {
            void refresh();
        };
        window.addEventListener('focus', focus);
        return () => {
            mounted.current = false;
            window.removeEventListener('focus', focus);
        };
    }, [refresh]);
    const change = async (address: string | null) => {
        if (!api || changing.current) throw new Error('A sharing change is already in progress.');
        changing.current = true;
        ++latest.current;
        setPending(true);
        try {
            const value = hostingSchema.parse(await api.setHosting(address));
            if (mounted.current) setState({ kind: 'ready', value });
        } finally {
            changing.current = false;
            if (mounted.current) setPending(false);
        }
    };
    return (
        <NativeHostingContext.Provider value={{ state, pending, refresh, change }}>
            {children}
        </NativeHostingContext.Provider>
    );
}
