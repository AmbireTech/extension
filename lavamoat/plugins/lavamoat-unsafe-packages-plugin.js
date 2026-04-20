/**
 * Excludes selected `node_modules` packages from LavaMoat Compartment wrapping.
 *
 * Why this exists:
 * Under LavaMoat, modules run inside a SES Compartment behind a `with(scopeProxy) { ... }` wrapper.
 * For some dependencies that sit on very hot paths, that wrapper prevents the engine from
 * JIT-optimizing the same way as plain code, which can *severely* hurt runtime performance.
 *
 * Example: `react-fast-compare` is a small deep-equality helper. It does not use sensitive
 * browser capabilities (e.g. `fetch`, `clipboard`, storage, or other high-value targets). The
 * pragmatic tradeoff is to exclude it from LavaMoat so the app stays responsive, while only
 * expanding this list when the same performance vs. isolation tradeoff is clearly acceptable.
 *
 * Package names live in `lavamoat/webpack/unsafe-packages.json` (`packages` array) so webpack and
 * CI share one list. Use the same strings as in `package.json` / the lockfile: no file paths, no
 * version ranges. Examples:
 * - Unscoped: `"react-fast-compare"`, `"react-devtools-core"`
 * - Scoped: `"@babel/runtime"`, `"@ledgerhq/logs"` (the `@scope/name` form is one string; `/` is
 *   part of the package name, not a path separator you add yourself)
 *
 * Safety net: `.github/workflows/lavamoat-unsafe-packages-gate.yml` runs `scripts/lavamoat-check-unsafe-packages.js`
 * on PRs/pushes. If `yarn.lock` changes for any listed package, the job fails and the log tells
 * reviewers to explicitly audit the new version and supply-chain risk; those modules are **not**
 * sandboxed by LavaMoat, so updates must not land without that review.
 *
 * @param {object} [options]
 * @param {string} [options.configPath] — absolute or cwd-relative path to JSON config
 */
const fs = require('fs')
const path = require('path')

function loadPackageNames(configPath) {
  const resolved = path.isAbsolute(configPath) ? configPath : path.join(process.cwd(), configPath)
  const raw = fs.readFileSync(resolved, 'utf8')
  const data = JSON.parse(raw)
  const packages = data.packages
  if (!Array.isArray(packages) || !packages.every((p) => typeof p === 'string' && p.length)) {
    throw new Error(
      `lavamoat-unsafe-packages-plugin: "${resolved}" must contain a non-empty "packages" string array`
    )
  }
  return packages
}

/**
 * Build a `resource` regexp for webpack's match against absolute module paths.
 *
 * Examples of `packageName` (from JSON) and what paths match:
 * - `react-fast-compare` → `.../node_modules/react-fast-compare/...`
 * - `@babel/runtime` → `.../node_modules/@babel/runtime/...`
 *
 * Unscoped names are one segment under `node_modules/`. Scoped npm names include a `/` in the
 * name (`@scope/pkg` → `node_modules/@scope/pkg` on disk), so we split on `/` and rejoin with
 * `[\\/]` so both Unix and Windows separators match. Escaping each segment is defensive if a name
 * ever contained regex metacharacters.
 */
function packageNameToResourceRegexp(packageName) {
  const parts = packageName
    .split('/')
    .map((segment) => segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  return new RegExp(`node_modules[\\\\/]${parts.join('[\\\\/]')}`)
}

function createLavamoatUnsafePackagesPlugin(options = {}) {
  const configPath =
    options.configPath || path.join(__dirname, '..', 'webpack', 'unsafe-packages.json')
  const packageNames = loadPackageNames(configPath)
  const { exclude } = require('@lavamoat/webpack')

  const rules = packageNames.map((name) => ({
    test: /\.(js|cjs|mjs)$/,
    resource: packageNameToResourceRegexp(name),
    use: exclude
  }))

  return {
    apply(compiler) {
      for (const rule of rules) {
        compiler.options.module.rules.push(rule)
      }
    }
  }
}

module.exports = createLavamoatUnsafePackagesPlugin
