import React from 'react'
import { View } from 'react-native'

import AmountIcon from '@common/assets/svg/AmountIcon'
import DollarIcon from '@common/assets/svg/DollarIcon'
import ValueIcon from '@common/assets/svg/ValueIcon'
import Alert from '@common/components/Alert/Alert'
import CoingeckoConfirmedBadge from '@common/components/CoingeckoConfirmedBadge'
import NetworkBadge from '@common/components/NetworkBadge'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import ActionFooter from '@common/modules/action-requests/components/ActionFooter'
import useWatchToken from '@common/modules/action-requests/hooks/useWatchToken'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'
import { HeaderWithLogoOnly } from '@common/modules/header/components/Header/Header'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

import getStyles from './styles'

export type TokenData = {
  address: string
  name: string
  symbol: string
  decimals: number
  image: string
}

const WatchTokenRequestScreen = () => {
  const { t } = useTranslation()
  const { theme, styles } = useTheme(getStyles)
  const {
    userRequest,
    tokenData,
    tokenNetwork,
    isLoading,
    showAlreadyInPortfolioMessage,
    networkWithFailedRPC,
    tokenTypeEligibility,
    tokenValidation,
    tokenValidationError,
    handleCancel,
    isTokenCustom,
    temporaryToken,
    portfolioToken,
    handleAddToken,
    tokenDetails
  } = useWatchToken()

  if (networkWithFailedRPC && networkWithFailedRPC?.length > 0 && !!temporaryToken) {
    return <Alert type="error" title={t('This network RPC is failing')} />
  }
  if (isLoading && tokenTypeEligibility === undefined) {
    return (
      <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
        <Spinner />
      </View>
    )
  }

  return (
    <MobileLayoutContainer
      header={isMobile ? undefined : <HeaderWithLogoOnly />}
      renderDirectChildren={() => (
        <ActionFooter
          onReject={handleCancel}
          onResolve={handleAddToken}
          resolveButtonText={isLoading ? t('Adding token...') : t('Add token')}
          resolveDisabled={
            isLoading ||
            showAlreadyInPortfolioMessage ||
            (!temporaryToken && !tokenTypeEligibility) ||
            !!tokenValidation?.error?.message ||
            !temporaryToken?.address ||
            !temporaryToken?.symbol ||
            !temporaryToken?.decimals
          }
        />
      )}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text weight="medium" fontSize={20} style={spacings.mbLg} numberOfLines={1}>
              {t('Add suggested token')}
            </Text>
            <View style={spacings.mb}>
              <TokenIcon
                withContainer
                chainId={tokenNetwork?.chainId}
                containerHeight={56}
                containerWidth={56}
                networkSize={20}
                address={tokenData?.address}
                width={48}
                height={48}
              />
            </View>
            <Text weight="semiBold" fontSize={20} numberOfLines={1} style={spacings.mbTy}>
              {tokenData?.symbol}
            </Text>
            <NetworkBadge
              withOnPrefix
              chainId={tokenNetwork?.chainId}
              fontSize={12}
              style={{
                backgroundColor: theme.primaryBackground,
                ...spacings.mb,
                ...spacings.pr
              }}
              withIcon={false}
            />
            {temporaryToken?.priceIn?.length ? (
              <View style={[flexbox.alignEnd]}>
                {tokenData && (
                  <CoingeckoConfirmedBadge
                    text={t('Confirmed')}
                    address={tokenData.address}
                    network={tokenNetwork}
                  />
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.contentBody}>
            <Text fontSize={14} weight="medium" style={spacings.mbTy}>
              {t('Token info')}
            </Text>
            <View style={[styles.tokenInfoContainer, spacings.mbTy]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mr]}>
                <View style={styles.tokenInfoIconWrapper}>
                  <AmountIcon color={theme.secondaryText} />
                </View>
                <Text fontSize={14} color={theme.secondaryText}>
                  {t('Amount')}
                </Text>
              </View>
              <Text weight="medium" fontSize={14} color={theme.secondaryText} numberOfLines={1}>
                {tokenDetails?.balance || '0.00'} {tokenData?.symbol}
              </Text>
            </View>
            <View style={[styles.tokenInfoContainer, spacings.mbTy]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mr]}>
                <View style={styles.tokenInfoIconWrapper}>
                  <DollarIcon color={theme.secondaryText} />
                </View>
                <Text fontSize={14} color={theme.secondaryText}>
                  {t('Price')}
                </Text>
              </View>
              <Text weight="medium" fontSize={14} color={theme.secondaryText}>
                {isLoading ? (
                  <View style={[flexbox.flex1, flexbox.alignCenter, flexbox.justifyCenter]}>
                    <Spinner style={{ width: 18, height: 18 }} />
                  </View>
                ) : (
                  tokenDetails?.priceUSDFormatted
                )}
              </Text>
            </View>
            <View style={[styles.tokenInfoContainer]}>
              <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mr]}>
                <View style={styles.tokenInfoIconWrapper}>
                  <ValueIcon color={theme.secondaryText} />
                </View>
                <Text fontSize={14} color={theme.secondaryText}>
                  {t('Value')}
                </Text>
              </View>
              <Text weight="medium" fontSize={14} color={theme.secondaryText}>
                {tokenDetails?.balanceUSDFormatted || '-'}
              </Text>
            </View>

            {!!showAlreadyInPortfolioMessage && (
              <View style={spacings.ptMd}>
                <Alert
                  size="sm"
                  type="info"
                  title={
                    isTokenCustom
                      ? t('This token is already added as a custom token.')
                      : t('This token is already in your portfolio.')
                  }
                />
              </View>
            )}

            {tokenData?.address && tokenValidationError?.message && (
              <View style={spacings.ptMd}>
                <Alert
                  type={tokenValidationError.type === 'network' ? 'warning' : 'error'}
                  title={tokenValidationError.message}
                />
              </View>
            )}

            {!tokenNetwork && !isLoading && !tokenValidationError?.message && (
              <View style={spacings.ptMd}>
                <Alert type="error" title={t('This token type is not supported.')} />
              </View>
            )}
          </View>
        </View>
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(WatchTokenRequestScreen)
