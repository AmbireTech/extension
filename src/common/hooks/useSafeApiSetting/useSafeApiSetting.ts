import { useCallback } from 'react'

import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectIsSafeApiEnabled = (state: AllControllersMappingType['FeatureFlagsController']) =>
  state.flags.safeApi

/**
 * Whether the user allows requests to the Safe API ("Sync Safe accounts" in the privacy
 * settings), and a way to turn it back on. Turning it on syncs the Safes right away, see the
 * `safeApi` listener in the MainController.
 */
const useSafeApiSetting = () => {
  const { state: isSafeApiEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectIsSafeApiEnabled
  )

  const enableSafeApi = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: { method: 'setFeatureFlag', args: ['safeApi', true] }
    })
  }, [featureFlagsDispatch])

  return { isSafeApiEnabled, enableSafeApi }
}

export default useSafeApiSetting
