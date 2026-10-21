import { Layout } from "@/views/layout.tsx";
import { PlasticCard } from "@/views/plastic-card.tsx";
import { Terminal } from "@/views/terminal.tsx";

export const NotFoundPage = ({ path }: { path: string }) => (
    <Layout title="shrtl — not found">
        <main class="flex min-h-dvh items-center justify-center p-6">
            <PlasticCard class="max-w-[380px] p-5">
                <Terminal title="ls" detail={path} tone="danger" />

                <p class="mt-4 font-mono text-[11px] break-all text-red-400/90">
                    ! no such file or directory
                </p>

                <a
                    href="/"
                    class="mt-5 block w-full rounded-md border border-white/10 py-2 text-center font-mono text-xs text-white/60 transition hover:border-accent/40 hover:text-accent"
                >
                    Back
                </a>
            </PlasticCard>
        </main>
    </Layout>
);
