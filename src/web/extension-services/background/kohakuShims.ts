/**
 * Makes `snarkjs` importable in a Manifest V3 service worker.
 *
 * `ffjavascript` (via snarkjs) builds its worker blob at module scope:
 *
 *   if (globalThis?.Blob) { ... workerSource = URL.createObjectURL(workerBlob) }
 *
 * A service worker has `Blob` but not `URL.createObjectURL`, so this throws on import and the
 * worker registration fails with an unhelpful "script evaluation failed".
 *
 * The stubbed URL is never loaded: with no `Worker`, ffjavascript takes its single-threaded path,
 * which ignores `workerSource` (about 9.5s per withdrawal proof, against 3s with threads).
 *
 * Must be the first import: ES modules evaluate imports before the importing file's statements.
 * A no-op where `URL.createObjectURL` exists (extension pages, the Firefox background page).
 */
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'data:application/javascript,'
}

export {}
