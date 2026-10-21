import { spawnSync } from "node:child_process";
import { watch } from "node:fs";

const build = () => {
    spawnSync("bunx", ["unocss", "src/**/*.tsx", "-o", "public/uno.css"], { stdio: "inherit" });
    spawnSync("bun", ["scripts/build-client.ts"], { stdio: "inherit" });
};

build();

let pending: ReturnType<typeof setTimeout> | undefined;

const schedule = () => {
    clearTimeout(pending);
    pending = setTimeout(build, 80);
};

watch("src", { recursive: true }, schedule);
watch("uno.config.ts", schedule);
