import { Network } from '@ambire-common/interfaces/network'

export const DISABLED_BUNDLER_DEFAULT = 'Using Pimlico'

/**
 * Optional fields when adding a custom network. Every other field is required.
 */
const ADD_NETWORK_OPTIONAL_FIELDS = [
  // `rpcUrl` is the input for typing a URL to add, not the network's RPC value.
  // It clears once the URL moves into the RPC list, so empty is its normal state.
  // The actual "at least one RPC URL" rule is enforced via `selectedRpcUrl`.
  'rpcUrl',
  'coingeckoPlatformId',
  'coingeckoNativeAssetId',
  'customBundlerUrl',
  'isColibriEnabled'
]

/**
 * The only required field when editing an existing network. Everything else is
 * already set and stays editable but optional.
 */
const EDIT_NETWORK_REQUIRED_FIELDS = ['explorerUrl']

/**
 * Returns the names of the required network-form fields that are still empty.
 */
const getEmptyRequiredNetworkFields = (
  formFields: Record<string, any>,
  isAddingCustomNetwork: boolean
): string[] => {
  return Object.keys(formFields).filter((key) => {
    const isRequired = isAddingCustomNetwork
      ? !ADD_NETWORK_OPTIONAL_FIELDS.includes(key)
      : EDIT_NETWORK_REQUIRED_FIELDS.includes(key)

    return isRequired && !formFields[key].length
  })
}

const handleErrors = (error: any) => {
  if (typeof error === 'boolean') return error
  if (typeof error?.message === 'string') return error?.message
  if (!error) return false
}

const getAreDefaultsChanged = (values: any, selectedNetwork?: Network) => {
  if (!selectedNetwork) return false
  delete values.rpcUrl
  // TODO: remove these 2
  delete values.platformId
  delete values.nativeAssetId

  return Object.keys(values).some((key) => {
    if (key === 'chainId') {
      return values[key] !== Number(selectedNetwork[key])
    }
    if (key === 'rpcUrls') {
      return (
        values[key].some((u: string) => !(selectedNetwork.rpcUrls || []).includes(u)) ||
        values[key].length !== (selectedNetwork.rpcUrls || []).length ||
        !values[key].length
      )
    }
    if (key === 'customBundlerUrl') {
      return values[key] !== (selectedNetwork[key] || '')
    }
    if (key === 'isColibriEnabled') {
      return values[key] !== !!selectedNetwork[key]
    }

    return key in selectedNetwork && values[key] !== selectedNetwork[key as keyof Network]
  })
}

export { getAreDefaultsChanged, getEmptyRequiredNetworkFields, handleErrors }
