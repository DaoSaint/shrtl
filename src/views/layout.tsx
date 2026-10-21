import type { Child } from "hono/jsx";
import type { HtmlEscapedString } from "hono/utils/html";

export const document = async (node: HtmlEscapedString | Promise<HtmlEscapedString>) =>
    `<!DOCTYPE html>${await node}`;

const phase = (seconds: number) => `animation-delay:-${(Math.random() * seconds).toFixed(2)}s`;

export const Layout = ({ title, children }: { title: string; children?: Child }) => (
    <html lang="en">
        <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>{title}</title>
            <link rel="icon" href="/favicon.png" type="image/png" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="stylesheet" href="/uno.css" />
        </head>
        <body class="relative min-h-screen bg-ink text-fg antialiased">
            <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
                <div class="absolute inset-0 hex" />
                <div class="hex-mask pointer-events-none absolute inset-0">
                    <div
                        class="glow-a absolute left-0 top-0 size-[980px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.95),transparent_48%)] blur-[21px]"
                        style={phase(6.4)}
                    />
                    <div
                        class="glow-b absolute left-0 top-0 size-[980px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.9),transparent_48%)] blur-[24px]"
                        style={phase(8.6)}
                    />
                    <div
                        class="glow-c absolute left-0 top-0 size-[980px] rounded-full bg-[radial-gradient(circle,rgba(196,181,253,0.85),transparent_46%)] blur-[18px]"
                        style={phase(10.7)}
                    />
                    <div
                        class="glow-d absolute left-0 top-0 size-[980px] rounded-full bg-[radial-gradient(circle,rgba(167,139,250,0.9),transparent_46%)] blur-[22px]"
                        style={phase(7.9)}
                    />
                </div>
            </div>
            <div class="relative">{children}</div>
        </body>
    </html>
);
