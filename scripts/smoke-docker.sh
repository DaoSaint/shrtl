#!/bin/sh
# Build the runtime image, start it, assert /healthz answers, clean up.
set -e
IMAGE=shrtl:smoke
PORT="${PORT:-3100}"
NAME=shrtl-smoke

docker build -t "$IMAGE" "${1:-.}" >/dev/null
docker rm -f "$NAME" >/dev/null 2>&1 || true
docker run -d --name "$NAME" -p "127.0.0.1:$PORT:3000" "$IMAGE" >/dev/null

for _ in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:$PORT/healthz" >/dev/null 2>&1; then
    echo "smoke: /healthz ok"
    docker rm -f "$NAME" >/dev/null
    exit 0
  fi
  sleep 0.5
done

echo "smoke: /healthz never answered" >&2
docker logs "$NAME" >&2 || true
docker rm -f "$NAME" >/dev/null
exit 1
