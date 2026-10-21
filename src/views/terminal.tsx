export const Terminal = ({
    title,
    detail,
    tone = "accent",
}: {
    title: string;
    detail?: string;
    tone?: "accent" | "danger";
}) => (
    <div class="flex min-w-0 items-center gap-2 font-mono text-[11px] whitespace-nowrap text-white/30">
        <span
            class={`size-2 shrink-0 rounded-full ${tone === "danger" ? "bg-red-400/70" : "bg-accent/60"}`}
        />
        <span>~/shrtl</span>
        <span class="text-white/15">$</span>
        <span class="text-white/50">{title}</span>
        {detail && <span class="truncate text-white/30">{detail}</span>}
    </div>
);
