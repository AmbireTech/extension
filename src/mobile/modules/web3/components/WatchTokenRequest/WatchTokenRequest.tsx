import { DappManifestData } from 'ambire-common/src/hooks/useDapps'
import { Token, UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio'
import React, { useCallback, useEffect, useState } from 'react'
import { View } from 'react-native'

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
import FoundTokenItem from '@common/modules/dashboard/components/AddOrHideToken/FoundTokenItem'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import getHostname from '@common/utils/getHostname'
import DappIcon from '@mobile/modules/web3/components/DappIcon'
import { Web3ContextData } from '@mobile/modules/web3/contexts/web3Context/types'

type Props = {
  approval: Web3ContextData['approval']
  resolveApproval: Web3ContextData['resolveApproval']
  rejectApproval: Web3ContextData['rejectApproval']
  isInBottomSheet?: boolean
  selectedDapp: DappManifestData | null
  tabSessionData: any
  closeBottomSheet?: (dest?: 'default' | 'alwaysOpen' | undefined) => void
}

const WatchTokenRequest = ({
  isInBottomSheet,
  closeBottomSheet,
  approval,
  selectedDapp,
  tabSessionData,
  rejectApproval,
  resolveApproval
}: Props) => {
  const { t } = useTranslation()
  const [loadingTokenDetails, setLoadingTokenDetails] = useState(true)
  const [error, setError] = useState('')
  const [extraToken, setExtraToken] = useState<Token | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const { network } = useNetwork()

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
    return () => {
      rejectApproval(t('User rejected the request.'))
      !!closeBottomSheet && closeBottomSheet()
    }
  }, [rejectApproval, closeBottomSheet, t])

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
      !!closeBottomSheet && closeBottomSheet()
    }
  }, [extraToken, onAddExtraToken, resolveApproval, closeBottomSheet])

  // On skip, resolve, since if you have positive balance of this token,
  // you will be able to see it in the Ambire Wallet in all cases.
  const handleSkipButtonPress = useCallback(() => {
    setIsAdding(true)
    resolveApproval(true)
    !!closeBottomSheet && closeBottomSheet()
  }, [resolveApproval, closeBottomSheet])

  const GradientWrapper = isInBottomSheet ? React.Fragment : GradientBackgroundWrapper

  return (
    <GradientWrapper>
      <Wrapper
        hasBottomTabNav={false}
        contentContainerStyle={{
          paddingTop: 0
        }}
        style={isInBottomSheet && spacings.ph0}
      >
        <Panel type="filled">
          <View style={[spacings.pvSm, flexboxStyles.alignCenter]}>
            <DappIcon
              iconUrl={
                selectedDapp?.id.includes('search:')
                  ? tabSessionData?.params?.icon
                  : selectedDapp?.iconUrl || ''
              }
            />
          </View>

          <Title style={[textStyles.center, spacings.phSm, spacings.pbLg]}>
            {selectedDapp?.id.includes('search:')
              ? tabSessionData?.params?.name
              : selectedDapp?.name || approval?.data?.params?.session?.name}
          </Title>

          {!loadingTokenDetails && error && (
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
                      {getHostname(
                        selectedDapp?.id.includes('search:')
                          ? tabSessionData?.params?.origin || ''
                          : selectedDapp?.url || ''
                      ) ||
                        approval?.data?.params?.session?.name ||
                        'webpage'}
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

                {extraToken && <FoundTokenItem {...extraToken} />}
              </View>

              {tokenEligibleStatus.isEligible && (
                <Button
                  disabled={isAdding || !extraToken}
                  type="outline"
                  onPress={handleAddToken}
                  text={isAdding ? t('Adding...') : t('Add token')}
                />
              )}
              {!tokenEligibleStatus.isEligible && (
                <Button
                  disabled={isAdding}
                  type="outline"
                  onPress={handleSkipButtonPress}
                  text={isAdding ? t('Confirming...') : t('Okay')}
                />
              )}

              <Text fontSize={14} style={textStyles.center}>
                {t('Token can be hidden any time from the Ambire extension settings.')}
              </Text>
            </>
          )}
        </Panel>
      </Wrapper>
    </GradientWrapper>
  )
}

export default React.memo(WatchTokenRequest)
