export const inputLine =
    "w-full border-b border-dashed bg-transparent pb-1 font-mono text-xs text-fg outline-none transition placeholder:text-white/15";

export const slugLine =
    "w-24 border-b border-dashed bg-transparent pb-0.5 font-mono text-xs text-fg outline-none placeholder:text-white/15";

export const fieldTone = (invalid: boolean) =>
    invalid ? "border-red-400/70 focus:border-red-400" : "border-white/15 focus:border-accent/60";

export const FormError = ({ message }: { message?: string }) =>
    message ? <p class="mt-3 font-mono text-[11px] text-red-400/90">! {message}</p> : null;
