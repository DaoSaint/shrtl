type Entry = { count: number; resetAt: number };

export const createRateLimit = ({
    limit,
    windowMs,
    now = Date.now,
}: {
    limit: number;
    windowMs: number;
    now?: () => number;
}) => {
    const entries = new Map<string, Entry>();

    const live = (key: string, at: number) => {
        const entry = entries.get(key);
        if (!entry) return undefined;
        if (entry.resetAt > at) return entry;
        entries.delete(key);
        return undefined;
    };

    const sweep = (at: number) => {
        for (const [key, entry] of entries) {
            if (entry.resetAt <= at) entries.delete(key);
        }
    };

    return {
        wait: (key: string) => {
            const at = now();
            const entry = live(key, at);
            if (!entry || entry.count < limit) return 0;
            return Math.ceil((entry.resetAt - at) / 1000);
        },

        fail: (key: string) => {
            const at = now();
            if (entries.size > 1024) sweep(at);

            const entry = live(key, at);
            if (entry) entry.count += 1;
            else entries.set(key, { count: 1, resetAt: at + windowMs });
        },

        clear: (key: string) => {
            entries.delete(key);
        },
    };
};
