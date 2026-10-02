import { isAddress } from 'ethers'
// The plain parser source rather than the package entry: json5's browser build
// bundles core-js shims that write globals, which LavaMoat would have to allow.
import parseJson5 from 'json5/lib/parse'

/** The id the user's own privacy network is selected by, alongside the preset ids. */
export const CUSTOM_NETWORK_ID = 'custom'

/**
 * A privacy network the user set up themselves: the same `specifier` and `config`
 * a preset has, entered by hand (or copied from a preset and edited).
 */
export type CustomNetwork = {
  specifier: string
  config?: unknown
  /**
   * The config exactly as the user typed it. JSON5 allows comments and loose
   * formatting that parsing drops, so this is what the form shows for editing.
   */
  configText?: string
}

export type CustomNetworkFieldErrors = {
  specifier?: string
  config?: string
}

type ParsedCustomNetwork =
  | { network: CustomNetwork; errors?: undefined }
  | { network?: undefined; errors: CustomNetworkFieldErrors }

/**
 * Validates the custom network form: `specifier` must be an address, and
 * `configText` is free-form JSON5 (any value; comments, trailing commas and
 * unquoted keys allowed), or empty for no config.
 * Shared by the settings form and the controller, so both reject the same input.
 */
export const parseCustomNetwork = (specifier: string, configText: string): ParsedCustomNetwork => {
  const errors: CustomNetworkFieldErrors = {}
  const trimmedSpecifier = specifier.trim()
  if (!isAddress(trimmedSpecifier)) {
    errors.specifier = 'Enter a contract address: 0x followed by 40 letters and numbers.'
  }

  let config: unknown
  if (configText.trim()) {
    try {
      config = parseJson5(configText)
    } catch (error) {
      errors.config = `This isn’t valid JSON5 (${error instanceof Error ? error.message : String(error)}).`
    }
  }

  if (errors.specifier || errors.config) return { errors }
  return {
    network: {
      specifier: trimmedSpecifier,
      ...(config !== undefined && { config, configText })
    }
  }
}

/** Whether a value read back from storage is a usable custom network. */
export const isCustomNetwork = (value: unknown): value is CustomNetwork =>
  !!value &&
  typeof value === 'object' &&
  typeof (value as CustomNetwork).specifier === 'string' &&
  isAddress((value as CustomNetwork).specifier)

/** A network's config as editable text: pretty-printed JSON (valid JSON5), or empty when it has none. */
export const formatNetworkConfig = (config: unknown): string =>
  config === undefined ? '' : JSON.stringify(config, null, 2)
