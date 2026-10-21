import { Layout } from "@/views/layout.tsx";
import { PlasticCard } from "@/views/plastic-card.tsx";
import { Terminal } from "@/views/terminal.tsx";
import { fieldTone, FormError, inputLine } from "@/views/field.tsx";

const prompt = "font-mono text-[11px] text-accent/70";

export const SetupPage = ({ error, errorField }: { error?: string; errorField?: string }) => (
    <Layout title="shrtl — setup">
        <main class="flex min-h-dvh items-center justify-center p-6">
            <PlasticCard class="max-w-[380px] p-5">
                <Terminal title="init --owner" />

                <FormError message={error} />

                <form method="post" action="/setup" class="mt-5 flex flex-col gap-3">
                    <label class="flex items-baseline gap-2">
                        <span class={prompt}>›</span>
                        <input
                            name="username"
                            value="admin"
                            readonly
                            class={`${inputLine} cursor-not-allowed text-white/40 ${fieldTone(errorField === "username")}`}
                        />
                    </label>

                    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <label class="flex items-baseline gap-2">
                            <span class={prompt}>›</span>
                            <input
                                name="password"
                                type="password"
                                placeholder="password"
                                required
                                class={`${inputLine} ${fieldTone(errorField === "password")}`}
                            />
                        </label>
                        <label class="flex items-baseline gap-2">
                            <span class={prompt}>›</span>
                            <input
                                name="confirm"
                                type="password"
                                placeholder="again"
                                required
                                class={`${inputLine} ${fieldTone(errorField === "confirm")}`}
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        class="mt-3 w-full rounded-md border border-white/10 py-2 font-mono text-xs text-white/60 transition hover:border-accent/40 hover:text-accent"
                    >
                        Create
                    </button>
                </form>
            </PlasticCard>
        </main>
    </Layout>
);
