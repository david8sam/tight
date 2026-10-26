import { networkInterfaces } from 'node:os';

function privateIPv4(address: string): boolean {
    const [first, second] = address.split('.').map(Number);
    return first === 10 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

/** Enumerate actual private IPv4 adapters; never accept a hostname or wildcard from the renderer. */
export function lanInterfaces() {
    const addresses = new Map<string, { name: string; address: string }>();
    for (const [name, records] of Object.entries(networkInterfaces())) {
        for (const record of records || []) {
            if (!record.internal && record.family === 'IPv4' && privateIPv4(record.address))
                addresses.set(record.address, { name, address: record.address });
        }
    }
    return [...addresses.values()];
}
