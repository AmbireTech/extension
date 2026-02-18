const { readFileSync } = require('fs')

/**
 * Webpack plugin that injects reflect-metadata into the background.js asset
 * BETWEEN SES repairIntrinsics() and hardenIntrinsics().
 *
 * Problem: Ledger SDK packages (@ledgerhq/context-module,
 * @ledgerhq/device-management-kit, @ledgerhq/device-signer-kit-ethereum) depend
 * on reflect-metadata, which adds methods like Reflect.getOwnMetadata,
 * Reflect.decorate, etc. via Object.defineProperty. After SES lockdown,
 * Reflect is frozen and non-standard properties are stripped, so
 * Object.defineProperty throws "Cannot define property" on a frozen target.
 *
 * Why this approach (not replacing globalThis.Reflect):
 * With LavaMoat's Compartment-based isolation, modules run in isolated
 * contexts that reference shared intrinsics (including Reflect), not
 * globalThis properties. Replacing globalThis.Reflect doesn't help because
 * Compartments see the intrinsic Reflect, not globalThis.Reflect.
 *
 * Solution: Inject reflect-metadata source code between repairIntrinsics()
 * (non-standard props removed, Reflect still mutable) and hardenIntrinsics()
 * (freezes everything). This modifies the intrinsic Reflect before it's frozen,
 * so all Compartments see the methods. When reflect-metadata later runs as a
 * normal webpack module, it detects the methods already exist and becomes a
 * no-op — no crash on the frozen Reflect.
 *
 * Note: globalThis itself is NOT frozen by SES, only its intrinsic *values* are.
 */
function createReflectMetadataShimPlugin() {
  return {
    apply(compiler) {
      const reflectSource = readFileSync(require.resolve('reflect-metadata'), 'utf-8')
      const {
        Compilation,
        sources: { RawSource }
      } = compiler.webpack

      compiler.hooks.thisCompilation.tap('ReflectMetadataShimPlugin', (compilation) => {
        compilation.hooks.processAssets.tap(
          {
            name: 'ReflectMetadataShimPlugin',
            stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE + 1
          },
          () => {
            for (const file in compilation.assets) {
              if (!/^background\.js$/.test(file)) continue

              const source = compilation.assets[file].source()
              const marker = '/*! end SES */'
              const idx = source.indexOf(marker)
              if (idx === -1) continue

              const insertPos = idx + marker.length

              // String concat (not template literals) — the reflect-metadata
              // source contains backticks in its JSDoc comments.
              // Simplified shim: injects reflect-metadata between repair and harden,
              // and wraps Object.defineProperty to prevent redefinition errors
              const shimCode =
                '\n;(function() {' +
                '\n  var _origRepair = globalThis.repairIntrinsics;' +
                '\n  if (typeof _origRepair === "function") {' +
                '\n    globalThis.repairIntrinsics = function(opts) {' +
                '\n      _origRepair.call(this, opts);' +
                '\n      // Wrap Object.defineProperty to catch "Cannot redefine property" errors' +
                '\n      // when reflect-metadata runs as a module after Reflect is frozen' +
                '\n      var _origDefineProperty = Object.defineProperty;' +
                '\n      var reflectMetadataProps = ["decorate", "metadata", "defineMetadata", "hasMetadata", "hasOwnMetadata",' +
                '\n        "getMetadata", "getOwnMetadata", "getMetadataKeys", "getOwnMetadataKeys", "deleteMetadata"];' +
                '\n      Object.defineProperty = function(target, prop, descriptor) {' +
                '\n        // Check if this is a reflect-metadata property being added to Reflect' +
                '\n        if (target && typeof prop === "string" && reflectMetadataProps.indexOf(prop) >= 0) {' +
                "\n          // Check if target is Reflect (could be globalThis.Reflect or a Compartment's Reflect)" +
                '\n          var isReflect = (target === globalThis.Reflect) ||' +
                '\n            (target && typeof target === "object" &&' +
                '\n             typeof target.apply === "function" && typeof target.construct === "function" &&' +
                '\n             typeof target.defineProperty === "function" && typeof target.get === "function");' +
                '\n          if (isReflect) {' +
                '\n            // Check if property already exists - if so, skip redefinition' +
                '\n            var existingDesc = Object.getOwnPropertyDescriptor(target, prop);' +
                '\n            if (existingDesc) {' +
                '\n              return target; // Property exists - skip redefinition' +
                '\n            }' +
                "\n            // Property doesn't exist yet - try to define it" +
                '\n            // Catch errors if Reflect becomes frozen between check and define' +
                '\n            try {' +
                '\n              return _origDefineProperty.call(this, target, prop, descriptor);' +
                '\n            } catch(e) {' +
                '\n              if (e.message && (e.message.indexOf("Cannot redefine property") >= 0 ||' +
                '\n                  e.message.indexOf("not extensible") >= 0 ||' +
                '\n                  e.message.indexOf("object is not extensible") >= 0)) {' +
                '\n                return target; // Property already exists on frozen Reflect, ignore' +
                '\n              }' +
                '\n              throw e;' +
                '\n            }' +
                '\n          }' +
                '\n        }' +
                '\n        return _origDefineProperty.call(this, target, prop, descriptor);' +
                '\n      };' +
                '\n      var _origHarden = globalThis.hardenIntrinsics;' +
                '\n      globalThis.hardenIntrinsics = function() {' +
                "\n        // Only run reflect-metadata if methods don't already exist" +
                '\n        if (!globalThis.Reflect || typeof globalThis.Reflect.decorate !== "function") {' +
                '\n          try { (function() {' +
                '\n' +
                reflectSource +
                '\n          })(); } catch(e) { console.warn("[ReflectMetadataShim] failed:", e); }' +
                '\n        }' +
                '\n        _origHarden.call(this);' +
                '\n      };' +
                '\n    };' +
                '\n  }' +
                '\n})();\n'

              compilation.assets[file] = new RawSource(
                source.slice(0, insertPos) + shimCode + source.slice(insertPos)
              )
            }
          }
        )
      })
    }
  }
}

module.exports = createReflectMetadataShimPlugin
