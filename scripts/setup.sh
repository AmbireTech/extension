#!/bin/sh
set -e

STALE_NODE_MODULES="src/ambire-common/node_modules"

if [ -d "$STALE_NODE_MODULES" ]; then
  if [ -t 0 ]; then
    printf "Detected stale %s. Remove it? (Y/n) " "$STALE_NODE_MODULES"
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
