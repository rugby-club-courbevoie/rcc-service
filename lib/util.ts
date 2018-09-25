export class InternalError extends Error {
    constructor(message: string) {
        super(message);
        debugger;
    }
}

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

export function withTrace<T>(message: string, body: () => T) {
    const t0 = Date.now();
    try {
        console.log(`BEGIN ${message}`);
        return body();
    } finally {
        console.log(`END ${message} (${Date.now() - t0} millis)`);
    }
}