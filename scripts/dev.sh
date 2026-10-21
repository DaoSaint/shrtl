#!/bin/sh
set -e
trap 'kill 0' EXIT INT TERM
bun scripts/watch-assets.ts &
bun --watch src/index.ts &
wait
