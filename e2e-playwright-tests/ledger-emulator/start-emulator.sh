#!/bin/bash
# Start the Ledger simulator (Speculos)

# Check if Docker is installed
if ! command -v docker >/dev/null 2>&1; then
  echo "Error: Docker is not installed or not in PATH."
  exit 1
fi

# Start the Ledger simulator
# On CI, cap CPU/RAM so Speculos shares the runner with Trezor + Playwright Chromium.
SPECULOS_DOCKER_RUN_OPTS=()
if [ "${CI:-}" = "true" ]; then
  SPECULOS_DOCKER_RUN_OPTS=(--memory=768m --cpus=1)
fi

docker pull ghcr.io/ledgerhq/speculos:0.25.13 && \
docker image tag ghcr.io/ledgerhq/speculos:0.25.13 speculos && \
docker run --rm -d \
  "${SPECULOS_DOCKER_RUN_OPTS[@]}" \
  -p 9999:9999 \
  -p 5000:5000 \
  -v ./apps:/speculos/apps \
  speculos \
  --model nanosp \
  ./apps/app.elf \
  --display headless \
  --apdu-port 9999 \
  --api-port 5000 \
  --transport HID \
  --seed "$LEDGER_EMULATOR_SEED"
