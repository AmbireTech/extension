import { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'

/** The providers in the order the UI lists them. */
export const PRIVACY_PROVIDER_IDS: readonly PrivacyProviderId[] = ['privacyPools', 'tornadoCash']

/** A provider's name, which is a brand and stays untranslated. */
export const PRIVACY_PROVIDER_NAMES: { [providerId in PrivacyProviderId]: string } = {
  privacyPools: 'Privacy Pools',
  tornadoCash: 'Tornado Cash'
}
