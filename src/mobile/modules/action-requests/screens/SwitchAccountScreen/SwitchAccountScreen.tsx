import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import DownArrowLongIcon from '@common/assets/svg/DownArrowLongIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import useWindowSize from '@common/hooks/useWindowSize'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import Account from '@common/modules/action-requests/components/SwitchAccount/Account'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'
import ManifestImage from '@web/components/ManifestImage'

import getStyles from './styles'

const SwitchAccountScreen = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const { addToast } = useToast()
  const {
    state: { account }
  } = useController('SelectedAccountController')
  const { dispatch: mainDispatch } = useController('MainController')

  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const { accounts } = useController('AccountsController').state
  const [isAuthorizing, setIsAuthorizing] = useState(false)
  const { minHeightSize } = useWindowSize()

  const userRequest = useMemo(() => {
    if (currentUserRequest?.kind !== 'switchAccount') return null

    return currentUserRequest
  }, [currentUserRequest])

  const nextAccount = userRequest?.meta.switchToAccountAddr
  const nextRequestType = userRequest?.meta.nextRequestKind
  const nextAccountData = useMemo(() => {
    if (!nextAccount) return null

    return accounts.find((acc) => acc.addr === nextAccount) || null
  }, [accounts, nextAccount])
  const nextRequestLabel = useMemo(() => {
    if (nextRequestType === 'calls') return 'transaction signature'
    if (nextRequestType === 'message') return 'message signature'

    return 'unknown request'
  }, [nextRequestType])

  const dAppData = useMemo(() => userRequest?.dappPromises[0]?.session, [userRequest])

  const handleDenyButtonPress = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: [t('User rejected the request.'), [userRequest.id]]
      }
    })
  }, [userRequest, t, requestsDispatch])

  const handleAuthorizeButtonPress = useCallback(() => {
    if (!userRequest) return

    if (!nextAccount) {
      addToast(
        t(
          'We are unable to switch to that account. Please reinitate the app request or contact support if the issue persists.'
        ),
        {
          type: 'error'
        }
      )
      return
    }

    setIsAuthorizing(true)

    mainDispatch({
      type: 'method',
      params: { method: 'selectAccount', args: [nextAccount] }
    })
  }, [addToast, userRequest, mainDispatch, nextAccount, t])

  const responsiveSizeMultiplier = useMemo(() => {
    if (minHeightSize('s')) return 0.85
    if (minHeightSize('m')) return 0.95

    return 1
  }, [minHeightSize])

  // Resolve the request
  useEffect(() => {
    if (account?.addr !== nextAccount || !userRequest || !userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [null, userRequest.id]
      }
    })
  }, [account?.addr, userRequest, requestsDispatch, nextAccount])

  return (
    <MobileLayoutContainer
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={isAuthorizing ? t('Switching...') : t('Switch Account')}
          resolveDisabled={isAuthorizing}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="switch-account-button"
        />
      )}
    >
      <View style={[styles.container]}>
        {!isAuthorizing ? (
          <View style={flexbox.flex1}>
            <View
              style={{
                ...flexbox.center,
                backgroundColor: theme.tertiaryBackground,
                ...spacings.pvLg
              }}
            >
              <Text fontSize={20} weight="medium">
                {t('Switch Account Request')}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: theme.primaryBackground,
                ...flexbox.alignCenter,
                ...spacings.pv,
                ...flexbox.flex1,
                ...spacings.phSm
              }}
            >
              {!!dAppData && (
                <View
                  style={[
                    flexbox.center,
                    {
                      marginBottom: SPACING_SM * responsiveSizeMultiplier
                    }
                  ]}
                >
                  <ManifestImage
                    uri={dAppData.icon}
                    size={responsiveSizeMultiplier * 56}
                    containerStyle={{
                      backgroundColor: theme.secondaryBackground
                    }}
                    iconScale={1}
                    imageStyle={{
                      backgroundColor: theme.secondaryBackground
                    }}
                    fallback={() => (
                      <ManifestFallbackIcon
                        width={responsiveSizeMultiplier * 56}
                        height={responsiveSizeMultiplier * 56}
                      />
                    )}
                  />
                </View>
              )}
              {!!dAppData && (
                <Text appearance="secondaryText" style={[spacings.mbSm, text.center]} fontSize={16}>
                  <Text appearance="primaryText" fontSize={16} weight="medium">
                    {dAppData.name}
                  </Text>{' '}
                  {t(`requires a ${nextRequestLabel} from `)}
                  <Text appearance="primaryText" fontSize={16} weight="medium">
                    {nextAccountData?.preferences.label ||
                      nextAccountData?.addr ||
                      'Unknown Account'}
                  </Text>
                </Text>
              )}

              {account && <Account style={spacings.mbSm} {...account} />}
              <DownArrowLongIcon
                style={[spacings.mbSm]}
                color={theme.secondaryText}
                width={16}
                height={16}
              />
              {nextAccountData ? (
                <Account
                  addr={nextAccountData?.addr || ''}
                  creation={nextAccountData?.creation || null}
                  preferences={
                    nextAccountData?.preferences || {
                      pfp: '',
                      label: ''
                    }
                  }
                  style={spacings.mbLg}
                />
              ) : (
                <Text appearance="errorText" style={spacings.mbLg} fontSize={16}>
                  {t('Invalid account data')}
                </Text>
              )}
              <Text style={text.center} appearance="secondaryText" fontSize={16}>
                {t(
                  'Would you like to switch to this account now to continue with the signing process?'
                )}
              </Text>
            </View>
          </View>
        ) : (
          <SkeletonLoader
            style={{
              ...styles.container,
              paddingVertical: SPACING_LG * responsiveSizeMultiplier
            }}
            width={responsiveSizeMultiplier * 450}
            height={responsiveSizeMultiplier * 450}
            appearance="primaryBackground"
          />
        )}
      </View>
    </MobileLayoutContainer>
  )
}

export default SwitchAccountScreen
