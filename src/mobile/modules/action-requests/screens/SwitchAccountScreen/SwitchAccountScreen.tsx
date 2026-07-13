import React from 'react'
import { View } from 'react-native'

import DownArrowLongIcon from '@common/assets/svg/DownArrowLongIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import Account from '@common/modules/action-requests/components/SwitchAccount/Account'
import useSwitchAccount from '@common/modules/action-requests/hooks/useSwitchAccount'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'
import ManifestImage from '@web/components/ManifestImage'

import getStyles from './styles'

const SwitchAccountScreen = () => {
  const {
    t,
    account,
    isAuthorizing,
    userRequest,
    nextAccount,
    nextAccountData,
    nextRequestLabel,
    dAppData,
    handleDenyButtonPress,
    handleAuthorizeButtonPress,
    responsiveSizeMultiplier
  } = useSwitchAccount()
  const { theme, styles } = useTheme(getStyles)

  return (
    <MobileLayoutContainer
      footerStyle={{ ...spacings.ph0, ...spacings.pt0 }}
      footer={
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={isAuthorizing ? t('Switching...') : t('Switch Account')}
          resolveDisabled={isAuthorizing}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="switch-account-button"
        />
      }
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
