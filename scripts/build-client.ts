import { mkdir } from "node:fs/promises";

await mkdir("public", { recursive: true });

const result = await Bun.build({
    entrypoints: ["src/client/dashboard.tsx"],
    outdir: "public",
    naming: "dashboard.js",
    target: "browser",
    tsconfig: "./src/client/tsconfig.json",
});

if (!result.success) {
    for (const log of result.logs) console.error(log);
    process.exit(1);
}
