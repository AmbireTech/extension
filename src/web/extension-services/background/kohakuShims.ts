/**
 * Makes `snarkjs` importable in a Manifest V3 service worker, which is where Privacy Pools
 * generates its withdrawal proofs.
 *
 * `ffjavascript` - reached through snarkjs, reached through the circuits package - builds its
 * worker blob at module scope:
 *
 *   if (globalThis?.Blob) { ... workerSource = URL.createObjectURL(workerBlob) }
 *
 * A `ServiceWorkerGlobalScope` has `Blob` but not `URL.createObjectURL`, so that branch is entered
 * and throws `TypeError: URL.createObjectURL is not a function` before any of our code runs. The
 * worker registration then fails outright with "script evaluation failed", which names neither the
 * module nor the reason.
 *
 * The stub is harmless because the URL it returns is never loaded: a service worker also has no
 * `Worker`, which is what ffjavascript checks to force its single-threaded path - the one that
 * ignores `workerSource` entirely. Measured at about 9.5s for a withdrawal proof that way, against
 * 3s with threads.
 *
 * Imported for its side effect and it must come first: ES modules evaluate imports before any
 * statement in the importing file, so a stub installed further down would arrive too late.
 *
 * A no-op anywhere `URL.createObjectURL` already exists - extension pages, the Firefox background
 * page - so this stays a single unconditional import rather than a platform branch.
 */
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'data:application/javascript,'
}

export {}
