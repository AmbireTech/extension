type RedactionRule = {
  pattern: RegExp
  replacement: string
}

// Regex-based redaction for high-risk secrets. This can still produce false positives/negatives.
const REDACTION_RULES: RedactionRule[] = [
  {
    // Matches known private-key labels and the following value.
    pattern:
      /\b(private\s*key|privatekey|priv\s*key|privkey|secret\s*key|wallet\s*key)\b\s*[:=]\s*(["']?)(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})\2/gi,
    replacement: '$1=[REDACTED_PRIVATE_KEY]'
  },
  {
    // Matches likely raw private keys without a label.
    pattern: /\b0x[a-fA-F0-9]{64}\b|\b[a-fA-F0-9]{64}\b/g,
    replacement: '[REDACTED_PRIVATE_KEY]'
  },
  {
    // Matches common seed phrase labels and the following 12-24 words.
    pattern:
      /\b(seed\s*phrase|recovery\s*phrase|mnemonic|secret\s*phrase)\b\s*[:=]\s*(["']?)((?:[a-z]+\s+){11,23}[a-z]+)\2/gi,
    replacement: '$1=[REDACTED_SEED_PHRASE]'
  },
  {
    // Matches likely raw seed phrases (12-24 lowercase words).
    pattern: /\b(?:[a-z]+\s+){11,23}[a-z]+\b/g,
    replacement: '[REDACTED_SEED_PHRASE]'
  }
]

const scrubString = (value: string): string => {
  return REDACTION_RULES.reduce((result, { pattern, replacement }) => {
    return result.replace(pattern, replacement)
  }, value)
}

const scrubUnknown = (value: unknown, seen: WeakSet<object>): unknown => {
  if (typeof value === 'string') {
    return scrubString(value)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  if (seen.has(value)) {
    return value
  }

  seen.add(value)

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = scrubUnknown(item, seen)
    })

    return value
  }

  const objectValue = value as Record<string, unknown>

  Object.keys(objectValue).forEach((key) => {
    objectValue[key] = scrubUnknown(objectValue[key], seen)
  })

  return objectValue
}

export const scrubSentryEventSecrets = <T>(event: T): T => {
  return scrubUnknown(event, new WeakSet()) as T
}
