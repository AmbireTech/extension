import { isAddress } from 'ethers'

/**
 * A privacy network the user can pick in settings. `specifier` is the on-chain
 * IWorkerSpecifier contract (Ethereum mainnet) that pins the network's
 * anon-client bundle by hash; `config` is passed to that bundle as-is and its
 * shape is defined by the network, not by anon-rpc.
 */
export type AnonRpcPreset = {
  id: string
  label: string
  specifier: string
  config?: unknown
}

type ParsedAnonRpcPresets = {
  presets: AnonRpcPreset[]
  /** Why some or all of the configured presets were rejected, if any were. */
  error: string | null
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const toPreset = (entry: unknown): AnonRpcPreset | string => {
  if (!entry || typeof entry !== 'object') return 'each preset must be an object'

  const { id, label, specifier, config } = entry as Record<string, unknown>
  if (!isNonEmptyString(id)) return 'a preset is missing its "id"'
  if (!isNonEmptyString(label)) return `preset "${id}" is missing its "label"`
  if (!isNonEmptyString(specifier) || !isAddress(specifier))
    return `preset "${id}" has an invalid "specifier" address`

  return { id, label, specifier, ...(config !== undefined && { config }) }
}

/**
 * Parses the `ANON_RPC_PRESETS` env value: a JSON array of
 * `{ id, label, specifier, config? }`. Invalid entries are skipped rather than
 * failing the whole list, and the reason is returned so settings can show it.
 */
export const parseAnonRpcPresets = (raw: string | undefined): ParsedAnonRpcPresets => {
  if (!isNonEmptyString(raw)) return { presets: [], error: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    return { presets: [], error: `ANON_RPC_PRESETS is not valid JSON: ${String(error)}` }
  }
  if (!Array.isArray(parsed)) {
    return { presets: [], error: 'ANON_RPC_PRESETS must be a JSON array' }
  }

  const presets: AnonRpcPreset[] = []
  const problems: string[] = []
  parsed.forEach((entry) => {
    const presetOrProblem = toPreset(entry)
    if (typeof presetOrProblem === 'string') {
      problems.push(presetOrProblem)
      return
    }
    if (presets.some((preset) => preset.id === presetOrProblem.id)) {
      problems.push(`preset "${presetOrProblem.id}" is listed more than once`)
      return
    }
    presets.push(presetOrProblem)
  })

  return {
    presets,
    error: problems.length ? `Some ANON_RPC_PRESETS were skipped: ${problems.join('; ')}` : null
  }
}
