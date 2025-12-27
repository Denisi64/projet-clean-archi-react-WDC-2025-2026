export type Result<Ok, Err> = { ok: true; value: Ok } | { ok: false; error: Err };

export function ok<Ok>(value: Ok): Result<Ok, never> {
    return { ok: true, value };
}

export function err<Err>(error: Err): Result<never, Err> {
    return { ok: false, error };
}
