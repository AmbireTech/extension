#!/bin/sh
set -e

STALE_NODE_MODULES="src/ambire-common/node_modules"

if [ -d "$STALE_NODE_MODULES" ]; then
  if [ -t 0 ]; then
    echo "Detected stale $STALE_NODE_MODULES. Nested node_modules shadow the root workspace dependencies during module resolution, which can cause duplicate or mismatched package versions and hard-to-debug build errors."
    printf "Remove it? (Y/n) "
    read -r answer
  else
    # Non-interactive (e.g. CI): no prompt possible, default to removing
    answer=""
  fi
  case "$answer" in
    n | N | no | NO | No)
      echo "Keeping $STALE_NODE_MODULES."
      ;;
    *)
      echo "Removing $STALE_NODE_MODULES..."
      rm -r "$STALE_NODE_MODULES"
      ;;
  esac
fi

yarn install
yarn allow-scripts
yarn patch-package
