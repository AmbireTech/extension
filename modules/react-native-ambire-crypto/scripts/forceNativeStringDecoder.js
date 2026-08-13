/* eslint-disable no-console */
// Re-applied after every `ubrn` generate (see the ubrn:* scripts in package.json).
//
// ubrn's StringHelperTemplate.ts picks a global TextDecoder when one exists and
// treats its C++ `string_from_buffer` helper as the fallback, on the assumption
// that Hermes has no TextDecoder. This app polyfills one in JS
// (@zxing/text-encoding, pulled in through shim.js), so the check passes and
// every string Rust returns is UTF-8 decoded byte-by-byte on the JS thread.
// Profiling a portfolio reload put that at ~1s: 500ms in encodeFunctionData and
// ~550ms across the decodeFunctionResult calls, which is more than the native
// decode saves in the first place.
//
// The C++ helper is compiled into this module unconditionally, so there is no
// reason to prefer the polyfill. This rewrites the ternary to always use it.
//
// Fails loudly rather than silently skipping: if a ubrn upgrade reshapes the
// template, the build should stop so the patch can be revisited instead of the
// slow path quietly coming back.

const fs = require('fs')
const path = require('path')

const GENERATED_FILE = path.join(__dirname, '..', 'src', 'generated', 'ambire_crypto.ts')

// Anchors the block we replace. `DECODER_START` begins it and `RETURN_START` is
// the first thing after it, which keeps this tolerant of how the ternary happens
// to be wrapped by the formatter.
const DECODER_START = '  const decoder: { decode(input: UniffiByteArray): string } ='
const RETURN_START = '  return {'
const TEXT_DECODER_CHECK = "typeof TextDecoder !== 'undefined'"
const NATIVE_HELPER = 'ubrn_uniffi_internal_fn_func_ffi__string_from_buffer'
const PATCH_MARKER = 'PATCHED by scripts/forceNativeStringDecoder.js'

const REPLACEMENT = `  // ${PATCH_MARKER}: always use the C++ decoder.
  // ubrn's template prefers a global TextDecoder, but this app polyfills that in
  // JS, which decodes every string Rust returns byte-by-byte on the JS thread.
  const decoder: { decode(input: UniffiByteArray): string } = {
    decode: (bytes: UniffiByteArray) =>
      nativeModule().${NATIVE_HELPER}(bytes, undefined as any) as string
  }
`

function fail(message) {
  console.error(`[forceNativeStringDecoder] ${message}`)
  console.error(
    '[forceNativeStringDecoder] Re-check ubrn\'s StringHelperTemplate.ts and update this script.'
  )
  process.exit(1)
}

function main() {
  if (!fs.existsSync(GENERATED_FILE)) {
    fail(`generated file not found at ${GENERATED_FILE}; run the ubrn generate step first.`)
  }

  const source = fs.readFileSync(GENERATED_FILE, 'utf8')

  if (source.includes(PATCH_MARKER)) {
    console.log('[forceNativeStringDecoder] already applied, nothing to do.')
    return
  }

  if (!source.includes(TEXT_DECODER_CHECK)) {
    fail('the TextDecoder check this patch removes is no longer in the generated bindings.')
  }
  if (!source.includes(NATIVE_HELPER)) {
    fail(`the C++ helper ${NATIVE_HELPER} is no longer in the generated bindings.`)
  }

  const start = source.indexOf(DECODER_START)
  if (start === -1) fail('could not find the string decoder declaration.')

  const end = source.indexOf(RETURN_START, start)
  if (end === -1) fail('could not find the end of the string converter block.')

  const block = source.slice(start, end)
  if (!block.includes(TEXT_DECODER_CHECK)) {
    fail('the TextDecoder check is no longer inside the decoder declaration.')
  }

  fs.writeFileSync(GENERATED_FILE, source.slice(0, start) + REPLACEMENT + source.slice(end))
  console.log('[forceNativeStringDecoder] patched: Rust strings now decode in C++.')
}

main()
