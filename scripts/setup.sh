#!/bin/sh
set -e

# A plain `git pull` doesn't fetch a submodule that was added after the clone, and without the
# bundled token and network icons the app can't resolve their imports. When this branch points to
# another commit of it, moves it there too, unless someone is working on the icons in it
ICONS_SUBMODULE="src/token-and-network-icons"
# The first character is `-` when it isn't initialized, `+` when it's at another commit
ICONS_SUBMODULE_STATE=$(git submodule status "$ICONS_SUBMODULE" | cut -c1)

if [ "$ICONS_SUBMODULE_STATE" = "-" ]; then
  git submodule update --init "$ICONS_SUBMODULE"
elif [ "$ICONS_SUBMODULE_STATE" = "+" ]; then
  if git -C "$ICONS_SUBMODULE" symbolic-ref -q HEAD >/dev/null || [ -n "$(git -C "$ICONS_SUBMODULE" status --porcelain)" ]; then
    echo "Leaving $ICONS_SUBMODULE as it is, since it's on a branch or has local changes. Run 'git submodule update $ICONS_SUBMODULE' to use the icons this branch expects."
  else
    git submodule update "$ICONS_SUBMODULE"
  fi
fi

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

# The inpage bundles are build output and gitignored, so a fresh clone has none.
# DappWebViewScreen require()s them, which throws when they are missing.
yarn build:webview
