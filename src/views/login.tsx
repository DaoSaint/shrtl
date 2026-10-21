import { Layout } from "@/views/layout.tsx";
import { PlasticCard } from "@/views/plastic-card.tsx";
import { Terminal } from "@/views/terminal.tsx";
import { fieldTone, FormError, inputLine } from "@/views/field.tsx";

export const LoginPage = ({ error, errorField }: { error?: string; errorField?: string }) => (
    <Layout title="shrtl — login">
        <main class="flex min-h-dvh items-center justify-center p-6">
            <PlasticCard class="max-w-[380px] p-5">
                <Terminal title="login" />

                <FormError message={error} />

                <form method="post" action="/login" class="mt-5 flex flex-col gap-3">
                    <label class="flex items-baseline gap-2">
                        <span class="font-mono text-[11px] text-accent/70">›</span>
                        <input
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            placeholder="password"
                            required
                            autofocus
                            class={`${inputLine} ${fieldTone(errorField === "password")}`}
                        />
                    </label>

                    <button
                        type="submit"
                        class="mt-3 w-full rounded-md border border-white/10 py-2 font-mono text-xs text-white/60 transition hover:border-accent/40 hover:text-accent"
                    >
                        Enter
                    </button>
                </form>
            </PlasticCard>
        </main>
    </Layout>
);
