import { transformSync } from '@babel/core'
import path from 'path'

import { describe, expect, test } from '@jest/globals'

/**
 * The exact shape of `relayerCall`: a TypeScript `this` parameter followed by parameters
 * with defaults. With Hermes as the target, Babel's parameter transform rewrites the
 * defaulted ones into `arguments[N]` lookups and used to count the `this` parameter while
 * doing it, so every one of them read one argument too far - in the mobile build only.
 */
const SOURCE = `
export async function call(
  this: { url: string },
  requestPath: string,
  method: string = 'GET',
  body: any = null,
  headers: any = null,
  timeoutMs: number = 20000
) {
  return { url: this.url, requestPath, method, body, headers, timeoutMs }
}
`

// What Metro passes for a native bundle. Without `engine: 'hermes'` the parameter
// transform does not fire at all and the bug is invisible, so it has to be set here.
const METRO_HERMES_CALLER = {
  name: 'metro',
  bundler: 'metro',
  platform: 'android',
  engine: 'hermes',
  isDev: true
}

const compileForMobile = () =>
  transformSync(SOURCE, {
    root: process.cwd(),
    filename: path.resolve('src/mobile/relayerCallShape.fixture.ts'),
    configFile: path.resolve('babel.config.js'),
    babelrc: false,
    caller: METRO_HERMES_CALLER as any
  })!.code!

const loadCompiled = (code: string) => {
  const moduleExports: Record<string, any> = {}

  new Function('exports', 'require', 'module', code)(moduleExports, require, {
    exports: moduleExports
  })

  return moduleExports.call as (...args: any[]) => Promise<any>
}

describe('babel.config.js: a TypeScript `this` parameter must not shift the others', () => {
  test('binds every parameter to the argument it was passed', async () => {
    const call = loadCompiled(compileForMobile())

    const received = await call.call(
      { url: 'https://relayer' },
      '/v2/erc7730/fetch-descriptor',
      'POST',
      { descriptorPath: 'registry/x.json' },
      undefined,
      4000
    )

    expect(received).toEqual({
      url: 'https://relayer',
      requestPath: '/v2/erc7730/fetch-descriptor',
      // Was the body before the fix, which is what made every relayer POST fail
      method: 'POST',
      body: { descriptorPath: 'registry/x.json' },
      // `undefined` was passed, so the default has to win
      headers: null,
      // Was 20000 before the fix, because 4000 landed in `headers`
      timeoutMs: 4000
    })
  })

  test('still applies the defaults when the arguments are omitted', async () => {
    const call = loadCompiled(compileForMobile())

    expect(await call.call({ url: 'https://relayer' }, '/v2/config/networks')).toEqual({
      url: 'https://relayer',
      requestPath: '/v2/config/networks',
      method: 'GET',
      body: null,
      headers: null,
      timeoutMs: 20000
    })
  })
})
