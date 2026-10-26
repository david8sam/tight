export function startHttpsHost(): Promise<{
    origin: string;
    claimUrl: string;
    certificate: string;
    stop: () => Promise<void>;
}>;
