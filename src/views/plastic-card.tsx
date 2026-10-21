import type { Child } from "hono/jsx";

export const PlasticCard = ({
    children,
    class: className,
}: {
    children?: Child;
    class?: string;
}) => (
    <div class={`plastic relative w-full rounded-2xl border border-white/12 ${className ?? ""}`}>
        <div class="absolute top-0 right-6 left-6 h-px bg-linear-to-r from-transparent via-accent/40 to-transparent" />
        {children}
    </div>
);
