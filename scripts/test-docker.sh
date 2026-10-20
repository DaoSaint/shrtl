#!/bin/sh
# Unit tests and typecheck inside the image, where the runtime is the only one
# that will ever exist in production.
set -e
docker build --target test -t shrtl:test "${1:-.}"
