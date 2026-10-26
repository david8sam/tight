type Diagnostic<Result> =
    | { status: 'fulfilled'; value: Result }
    | { status: 'rejected'; message: string }
    | { status: 'timed-out' };

/** Bound each diagnostic independently so one stuck process cannot discard another's result. */
export async function captureDiagnostic<Result>(read: Promise<Result>): Promise<Diagnostic<Result>> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            read.then(
                (value): Diagnostic<Result> => ({ status: 'fulfilled', value }),
                (error: unknown): Diagnostic<Result> => ({
                    status: 'rejected', message: error instanceof Error ? error.message : 'Diagnostic read failed',
                }),
            ),
            new Promise<Diagnostic<Result>>(resolve => {
                timer = setTimeout(() => resolve({ status: 'timed-out' }), 2000);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}
