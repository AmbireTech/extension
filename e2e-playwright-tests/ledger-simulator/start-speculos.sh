docker pull ghcr.io/ledgerhq/speculos:0.25.13 && \
docker image tag ghcr.io/ledgerhq/speculos:0.25.13 speculos && \
docker run --rm -it -p 9999:9999 -p 5000:5000 -v "$(pwd)"/e2e-playwright-tests/ledger-simulator/apps:/speculos/apps speculos --model nanosp ./apps/app.elf --display headless --apdu-port 9999 --api-port 5000 --transport HID --seed "$SEED"