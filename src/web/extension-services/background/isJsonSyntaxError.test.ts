import { isJsonSyntaxError } from './isJsonSyntaxError'

describe('isJsonSyntaxError', () => {
  it('matches a failed JSON parse of an HTML page, but not other syntax errors', () => {
    let jsonError: unknown
    try {
      JSON.parse('<!DOCTYPE html><html></html>')
    } catch (error) {
      jsonError = error
    }

    let bigIntError: unknown
    try {
      BigInt('not a number')
    } catch (error) {
      bigIntError = error
    }

    expect(isJsonSyntaxError(jsonError)).toBe(true)
    expect(isJsonSyntaxError(bigIntError)).toBe(false)
  })
})
