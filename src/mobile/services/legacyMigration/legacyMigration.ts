import { createMMKV } from 'react-native-mmkv'

// The legacy (v1) mobile app persisted its data in the DEFAULT MMKV instance
// (`new MMKV()` with no id, i.e. `mmkv.default`). The v2 app uses dedicated
// instances ('asyncStorage', 'syncStorage', ...), so the legacy data lives
// untouched in the default instance and can be read from here.
const legacyStorage = createMMKV()

// Dedicated instance for the migration-onboarding flag so the feature stays
// self-contained and does not depend on the v2 storage internals.
const migrationStorage = createMMKV({ id: 'migration' })

const HAS_PASSED_KEY = 'v2MigrationOnboardingPassed'

// A subset of the legacy v1 `Account` shape. Email-based smart accounts (the
// only ones needing a JSON backup) have a non-empty `email`; `primaryKeyBackup`
// holds the encrypted key blob that wallet.ambire.com restores from.
export type LegacyAccount = {
  id: string
  email: string
  primaryKeyBackup: string
  [key: string]: any
}

const getLegacyAccounts = (): LegacyAccount[] => {
  const serialized = legacyStorage.getString('accounts')
  if (!serialized) return []

  try {
    const parsed = JSON.parse(serialized)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getLegacyEmailAccounts = (): LegacyAccount[] =>
  getLegacyAccounts().filter((account) => !!account.email)

const hasLegacyAccounts = (): boolean => getLegacyAccounts().length > 0

const hasPassedMigrationOnboarding = (): boolean =>
  migrationStorage.getBoolean(HAS_PASSED_KEY) === true

const markMigrationOnboardingPassed = (): void => {
  migrationStorage.set(HAS_PASSED_KEY, true)
}

// Show the migration onboarding only to users updating from the legacy v1 app
// (i.e. accounts exist in the legacy storage) who have not seen it yet.
const shouldShowMigrationOnboarding = (): boolean =>
  hasLegacyAccounts() && !hasPassedMigrationOnboarding()

export { getLegacyEmailAccounts, shouldShowMigrationOnboarding, markMigrationOnboardingPassed }
