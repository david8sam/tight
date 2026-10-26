import { z } from 'zod';

const address = z.ipv4();
const base = z.object({
    port: z.number().int().min(1).max(65535),
    restoreError: z.enum(['unavailable', 'failed']).optional(),
    interfaces: z.array(z.object({ name: z.string(), address })),
});
export const hostingSchema = z.discriminatedUnion('mode', [
    base.extend({ mode: z.literal('local') }),
    base.extend({ mode: z.literal('lan'), address }),
]);
export type Hosting = z.infer<typeof hostingSchema>;
export function lanOrigin(hosting: Hosting): string | null {
    return hosting.mode === 'lan' && hosting.interfaces.some(adapter => adapter.address === hosting.address)
        ? `http://${hosting.address}:${hosting.port}`
        : null;
}

export interface DesktopHostingBridge {
    getHosting: () => Promise<unknown>;
    setHosting: (address: string | null) => Promise<unknown>;
}
declare global {
    interface Window {
        tightDesktop?: DesktopHostingBridge;
    }
}
