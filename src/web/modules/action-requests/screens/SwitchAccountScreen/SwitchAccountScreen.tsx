import React from 'react'
import { View } from 'react-native'

import DownArrowLongIcon from '@common/assets/svg/DownArrowLongIcon'
import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Alert from '@common/components/Alert'
import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import ManifestImage from '@common/components/ManifestImage'
import SkeletonLoader from '@common/components/SkeletonLoader'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import Account from '@common/modules/action-requests/components/SwitchAccount/Account'
import useSwitchAccount from '@common/modules/action-requests/hooks/useSwitchAccount'
import spacings, { SPACING_LG, SPACING_MD } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { TabLayoutContainer } from '@web/components/TabLayoutWrapper/TabLayoutWrapper'

import getStyles from './styles'

const SwitchAccountScreen = () => {
  const {
    t,
    account,
    isAuthorizing,
    isRequestBroken,
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
    <TabLayoutContainer
      width="full"
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleDenyButtonPress}
          onResolve={handleAuthorizeButtonPress}
          resolveButtonText={isAuthorizing ? t('Switching...') : t('Switch Account')}
          resolveDisabled={isAuthorizing || isRequestBroken}
          rejectButtonText={t('Deny')}
          resolveButtonTestID="switch-account-button"
        />
      )}
    >
      <View
        style={[
          styles.container,
          {
            paddingVertical: SPACING_LG * responsiveSizeMultiplier,
            width: responsiveSizeMultiplier * 530
          }
        ]}
      >
        <AmbireLogoHorizontal
          style={{ marginBottom: SPACING_LG * responsiveSizeMultiplier, minHeight: 28 }}
        />
        {!isAuthorizing ? (
          <View style={styles.content}>
            <View
              style={{
                ...flexbox.center,
                ...spacings.pvLg,
                ...spacings.phLg,
                backgroundColor: theme.secondaryBackground
              }}
            >
              <Text
                fontSize={20}
                weight="medium"
                style={{
                  marginBottom: SPACING_MD * responsiveSizeMultiplier
                }}
              >
                {t('Switch Account Request')}
              </Text>
              {!!dAppData && (
                <View
                  style={[
                    flexbox.center,
                    {
                      marginBottom: SPACING_MD * responsiveSizeMultiplier
                    }
                  ]}
                >
                  <ManifestImage
                    uri={dAppData.icon}
                    size={responsiveSizeMultiplier * 48}
                    containerStyle={{
                      backgroundColor: theme.secondaryBackground
                    }}
                    iconScale={1}
                    imageStyle={{
                      backgroundColor: theme.secondaryBackground
                    }}
                    fallback={() => (
                      <ManifestFallbackIcon
                        width={responsiveSizeMultiplier * 48}
                        height={responsiveSizeMultiplier * 48}
                      />
                    )}
                  />
                </View>
              )}
              {!!dAppData && (
                <Text appearance="secondaryText" style={text.center}>
                  <Text appearance="secondaryText" weight="semiBold">
                    {dAppData.name}
                  </Text>{' '}
                  {t(`requires a ${nextRequestLabel} from:\n`)}
                  <Text appearance="secondaryText" weight="semiBold">
                    {nextAccountData?.preferences.label ||
                      nextAccountData?.addr ||
                      'Unknown Account'}
                  </Text>
                </Text>
              )}
            </View>
            <View
              style={{
                backgroundColor: theme.primaryBackground,
                ...flexbox.alignCenter,
                ...spacings.pvLg,
                ...spacings.phLg
              }}
            >
              {account && <Account {...account} />}
              <View
                style={{
                  ...flexbox.center,
                  ...spacings.mvTy,
                  width: 32 * responsiveSizeMultiplier,
                  height: 32 * responsiveSizeMultiplier,
                  borderRadius: 16,
                  backgroundColor: theme.secondaryBackground
                }}
              >
                <DownArrowLongIcon color={theme.iconPrimary} width={12} height={12} />
              </View>
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
                <Text appearance="errorText" style={spacings.mbLg}>
                  {nextAccount || t('Invalid account data')}
                </Text>
              )}
              {!isRequestBroken && (
                <Text style={text.center} weight="medium">
                  {t(
                    'Would you like to switch to this account now to continue with the signing process?'
                  )}
                </Text>
              )}
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
        {isRequestBroken && (
          <Alert
            style={spacings.mtLg}
            type="error"
            title={t('Unable to switch account')}
            text={t(
              'The requested account is not available. Add the account or reconnect the app to continue. If the issue persists, please contact support.'
            )}
          />
        )}
      </View>
    </TabLayoutContainer>
  )
}

export default SwitchAccountScreen
