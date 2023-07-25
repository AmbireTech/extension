import { Token, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

import ManifestFallbackIcon from '@common/assets/svg/ManifestFallbackIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Panel from '@common/components/Panel'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import Wrapper from '@common/components/Wrapper'
import { Trans, useTranslation } from '@common/config/localization'
import useNetwork from '@common/hooks/useNetwork'
import usePortfolio from '@common/hooks/usePortfolio'
import useToken from '@common/hooks/useToken'
import TokenItem from '@common/modules/dashboard/components/AddOrHideToken/HideTokenListItem'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import ManifestImage from '@web/components/ManifestImage'
import useApproval from '@web/hooks/useApproval'

import styles from './styles'

const WatchTokenRequestScreen = () => {
  const { t } = useTranslation()
  const [loadingTokenDetails, setLoadingTokenDetails] = useState(true)
  const [error, setError] = useState('')
  const [extraToken, setExtraToken] = useState<Token | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { network } = useNetwork()
  const { approval, resolveApproval, rejectApproval } = useApproval()
  const { onAddExtraToken, checkIsTokenEligibleForAddingAsExtraToken, extraTokens } = usePortfolio()
  const { getTokenDetails } = useToken()
  const [tokenEligibleStatus, setTokenEligibleStatus] = useState<
    ReturnType<UsePortfolioReturnType['checkIsTokenEligibleForAddingAsExtraToken']>
  >({
    isEligible: false
  })

  const tokenSymbol = approval?.data?.params?.data?.options?.symbol
  const tokenAddress = approval?.data?.params?.data?.options?.address

  useEffect(() => {
    setLoadingTokenDetails(true)
    setError('')

    if (!tokenAddress) {
      setLoadingTokenDetails(false)
      setError('')
      return
    }

    ;(async () => {
      try {
        const token = await getTokenDetails(tokenAddress)
        setExtraToken(token)

        if (!token)
          throw new Error(
            t('Token does not appear to correspond to an ERC20 token on {{networkName}}.', {
              networkName: network?.name
            })
          )

        setTokenEligibleStatus(checkIsTokenEligibleForAddingAsExtraToken(token, extraTokens))
      } catch {
        setLoadingTokenDetails(false)
        setError(
          t('Token does not appear to correspond to an ERC20 token on {{networkName}}.', {
            networkName: network?.name
          })
        )
      }

      setLoadingTokenDetails(false)
    })()
    // Do not include the `checkIsTokenEligibleForAddingAsExtraToken`, because
    // its deps (tokens, constants) are not properly memoized which triggers
    // way too many re-renderings than needed (and loading indicator is shown)
    // eslint-disable-next-line  react-hooks/exhaustive-deps
  }, [getTokenDetails, t, tokenAddress])

  const handleAddToken = useCallback(async () => {
    setIsAdding(true)

    if (extraToken) {
      onAddExtraToken(extraToken)
      resolveApproval(true)
    }
  }, [extraToken, onAddExtraToken, resolveApproval])

  // On skip, resolve, since if you have positive balance of this token,
  // you will be able to see it in the Ambire Wallet in all cases.
  const handleSkipButtonPress = useCallback(() => {
    setIsAdding(true)
    resolveApproval(true)
  }, [resolveApproval])

  const handleDenyButtonPress = useCallback(
    () => rejectApproval(t('User rejected the request.')),
    [t, rejectApproval]
  )

  return (
    <GradientBackgroundWrapper>
      <Wrapper
        hasBottomTabNav={false}
        contentContainerStyle={{
          paddingTop: 0
        }}
      >
        <Panel type="filled">
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <ManifestImage
              uri={approval?.data?.params?.session?.icon}
              size={64}
              fallback={() => <ManifestFallbackIcon />}
            />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {approval?.data?.origin ? new URL(approval?.data?.origin)?.hostname : ''}
          </Title>

          {!loadingTokenDetails && error && (
            <>
              <View>
                <Text
                  fontSize={14}
                  weight="regular"
                  style={[textStyles.center, spacings.phSm, spacings.mbLg]}
                  appearance="danger"
                >
                  {error}
                </Text>
              </View>

              <View style={styles.buttonWrapper}>
                <Button
                  type="outline"
                  accentColor={colors.titan}
                  onPress={handleDenyButtonPress}
                  text={t('Dismiss')}
                />
              </View>
            </>
          )}

          {loadingTokenDetails && !error && (
            <View style={flexboxStyles.center}>
              <Spinner />
            </View>
          )}

          {!loadingTokenDetails && !error && (
            <>
              <View>
                <Trans values={{ tokenSymbol, tokenAddress }}>
                  <Text style={[textStyles.center, spacings.phSm, spacings.mbLg]}>
                    <Text fontSize={14} weight="regular">
                      {'The dApp '}
                    </Text>
                    <Text fontSize={14} weight="regular" color={colors.heliotrope}>
                      {approval?.data?.params?.name || ''}
                    </Text>
                    <Text fontSize={14} weight="regular">
                      {
                        ' is requesting to add the {{tokenSymbol}} token {{tokenAddress}} to the Ambire Wallet tokens list.'
                      }
                    </Text>
                  </Text>
                </Trans>

                {!tokenEligibleStatus.isEligible && !!tokenEligibleStatus.reason && (
                  <Text
                    fontSize={14}
                    weight="regular"
                    style={[textStyles.center, spacings.phSm, spacings.mbLg]}
                  >
                    {tokenEligibleStatus.reason}
                  </Text>
                )}

                {extraToken && <TokenItem {...extraToken} />}
              </View>

              <View style={styles.buttonsContainer}>
                {tokenEligibleStatus.isEligible && (
                  <>
                    <View style={styles.buttonWrapper}>
                      <Button
                        disabled={isAdding}
                        type="danger"
                        onPress={handleDenyButtonPress}
                        text={t('Deny')}
                      />
                    </View>
                    <View style={styles.buttonWrapper}>
                      <Button
                        disabled={isAdding || !extraToken}
                        type="outline"
                        onPress={handleAddToken}
                        text={isAdding ? t('Adding...') : t('Add token')}
                      />
                    </View>
                  </>
                )}
                {!tokenEligibleStatus.isEligible && (
                  <View style={styles.buttonWrapper}>
                    <Button
                      disabled={isAdding}
                      type="outline"
                      onPress={handleSkipButtonPress}
                      text={isAdding ? t('Confirming...') : t('Okay')}
                    />
                  </View>
                )}
              </View>

              <Text fontSize={14} style={textStyles.center}>
                {t('Token can be hidden any time from the Ambire extension settings.')}
              </Text>
            </>
          )}
        </Panel>
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default React.memo(WatchTokenRequestScreen)
