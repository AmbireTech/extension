import { getAddress } from 'ethers'
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { View } from 'react-native'

import { Network } from '@ambire-common/interfaces/network'
import { isValidAddress } from '@ambire-common/services/address'
import Alert from '@common/components/Alert/Alert'
import CoingeckoConfirmedBadge from '@common/components/CoingeckoConfirmedBadge'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import {
  getTokenEligibility,
  getTokenFromPortfolio,
  getTokenFromTemporaryTokens,
  handleTokenIsInPortfolio
} from '@common/modules/action-requests/utils/watchTokenRequest'
import AddAssetBottomSheet from '@common/modules/settings/components/AddAssetBottomSheet'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  sheetRef: React.RefObject<any>
  handleClose: () => void
}

const AddTokenBottomSheet: FC<Props> = ({ sheetRef, handleClose }) => {
  const { t } = useTranslation()
  const { networks, isInitialized } = useController('NetworksController').state
  const { addToast } = useToast()
  const {
    state: { validTokens, customTokens, temporaryTokens },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const {
    state: { portfolio: selectedAccountPortfolio, account }
  } = useController('SelectedAccountController')
  const [network, setNetwork] = useState<Network | undefined>(
    isInitialized ? (networks.find((n) => n.chainId === 1n) ?? networks[0]) : undefined
  )
  const [showAlreadyInPortfolioMessage, setShowAlreadyInPortfolioMessage] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAdditionalHintRequested, setAdditionalHintRequested] = useState(false)

  const {
    control,
    watch,
    setError,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ mode: 'all', defaultValues: { address: '' } })
  // Pasted addresses often carry whitespace, which fails the validation
  const address = watch('address', '').trim()

  const tokenTypeEligibility = useMemo(
    () => getTokenEligibility({ address }, validTokens, network),
    [validTokens, address, network]
  )

  const tokenValidation = useMemo(() => {
    if (!address || !network) return null

    return validTokens.erc20[`${address}-${network.chainId}`]
  }, [validTokens, address, network])

  const isCustomToken = useMemo(
    () =>
      !!customTokens.find(
        ({ address: addr, chainId }) =>
          addr.toLowerCase() === address.toLowerCase() && chainId === network?.chainId
      ),
    [customTokens, address, network]
  )
  const temporaryToken = useMemo(
    () => getTokenFromTemporaryTokens(temporaryTokens, { address }, network),
    [temporaryTokens, address, network]
  )

  const portfolioToken = useMemo(
    () => getTokenFromPortfolio({ address }, network, selectedAccountPortfolio),
    [selectedAccountPortfolio, network, address]
  )

  const handleCloseAndReset = useCallback(() => {
    handleClose()
    reset({ address: '' })
    setAdditionalHintRequested(false)
    setIsLoading(false)
    setShowAlreadyInPortfolioMessage(false)
  }, [handleClose, reset])

  const handleAddToken = useCallback(async () => {
    if (!isValidAddress(address) || !network) return

    if (!temporaryToken?.address || !temporaryToken?.symbol || !temporaryToken?.decimals) {
      addToast(
        t(
          'Unable to add the token because the provided token parameters are invalid. Please verify the token details and try again.'
        ),
        { type: 'error' }
      )
      return
    }

    if (!account) return

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'addCustomToken',
        args: [
          {
            address: getAddress(temporaryToken.address),
            standard: 'ERC20',
            chainId: network.chainId
          },
          account.addr,
          true
        ]
      }
    })
    addToast(
      t('Added token {{address}} on {{network}} to your portfolio', {
        address,
        network: network.name
      })
    )
    handleCloseAndReset()
  }, [
    address,
    network,
    temporaryToken?.address,
    temporaryToken?.symbol,
    temporaryToken?.decimals,
    portfolioDispatch,
    addToast,
    t,
    handleCloseAndReset,
    account
  ])

  const handleTokenType = useCallback(() => {
    if (!network || !network.chainId) {
      addToast(
        t(
          'Missing required network details for this token. Please try again later or contact Ambire support.'
        ),
        { type: 'error' }
      )
      return
    }

    if (!account) return

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'updateTokenValidationByStandard',
        args: [{ address, chainId: network.chainId }, account.addr, true]
      }
    })
  }, [network, address, addToast, t, account, portfolioDispatch])

  useEffect(() => {
    const handleEffect = async () => {
      if (!address || !network) return
      if (address && !isValidAddress(address)) {
        setError('address', { message: t('Invalid address') })
        return
      }
      // Check if token is already in portfolio
      const isTokenInHints = await handleTokenIsInPortfolio(
        isCustomToken,
        selectedAccountPortfolio,
        network,
        { address }
      )
      if (isTokenInHints) {
        setIsLoading(false)
        setShowAlreadyInPortfolioMessage(true)
        return
      }

      if (!temporaryToken) {
        if (tokenTypeEligibility && !isAdditionalHintRequested) {
          setIsLoading(true)
          if (!account) return

          portfolioDispatch({
            type: 'method',
            params: {
              method: 'getTemporaryTokens',
              args: [account.addr, network?.chainId, getAddress(address)]
            }
          })
          setAdditionalHintRequested(true)
        } else if (tokenTypeEligibility === undefined) {
          setIsLoading(true)
          handleTokenType()
        } else if (tokenTypeEligibility === false && tokenValidation?.error) {
          // Retry validation if there was an error and token type is false
          setIsLoading(true)
          handleTokenType()
        }
      }

      // Stop loading if there's a validation error
      if (tokenValidation?.error) {
        setIsLoading(false)
      }
    }

    handleEffect().catch((error) => {
      console.error(error)
      return setIsLoading(false)
    })

    if (tokenTypeEligibility === false || !!temporaryToken || tokenValidation?.error) {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    t,
    address,
    network,
    tokenTypeEligibility,
    temporaryToken,
    isAdditionalHintRequested,
    tokenValidation
  ])

  useEffect(() => {
    setShowAlreadyInPortfolioMessage(false) // Reset the state when address changes
    setAdditionalHintRequested(false)
  }, [address, network])

  return (
    <AddAssetBottomSheet
      id="add-custom-token"
      sheetRef={sheetRef}
      handleClose={handleCloseAndReset}
      title={t('Add token')}
      headerTestID="add-token-modal-title-text"
      addressLabel={t('Token address')}
      addressFieldTestID="token-address-field"
      addressError={errors.address && errors.address.message}
      network={network}
      onNetworkChange={setNetwork}
      submitText={t('Add token')}
      submitTestID="add-token-button"
      isSubmitDisabled={
        showAlreadyInPortfolioMessage ||
        (!temporaryToken && !tokenTypeEligibility) ||
        !!tokenValidation?.error?.message ||
        !isValidAddress(address) ||
        !network ||
        isSubmitting
      }
      onSubmit={handleAddToken}
      control={control}
    >
      {temporaryToken || portfolioToken ? (
        <View
          style={[
            flexbox.directionRow,
            flexbox.justifySpaceBetween,
            flexbox.alignCenter,
            spacings.phTy,
            spacings.pvTy
          ]}
        >
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <TokenIcon
              containerHeight={32}
              containerWidth={32}
              width={22}
              height={22}
              withContainer
              chainId={network?.chainId}
              address={address}
            />
            <Text testID="custom-token-name" fontSize={16} style={spacings.mlTy} weight="semiBold">
              {temporaryToken?.symbol || portfolioToken?.symbol}
            </Text>
          </View>
          <View testID="confirmed-pill-text" style={flexbox.directionRow}>
            {(temporaryToken?.priceIn?.length || portfolioToken?.priceIn?.length) && network ? (
              <CoingeckoConfirmedBadge text="Confirmed" address={address} network={network} />
            ) : null}
          </View>
        </View>
      ) : null}

      {address && tokenValidation && tokenValidation?.error?.message ? (
        <Alert
          type={tokenValidation.error.type === 'network' ? 'warning' : 'error'}
          isTypeLabelHidden
          title={tokenValidation.error.message}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {address && showAlreadyInPortfolioMessage ? (
        <Alert
          type="warning"
          isTypeLabelHidden
          title={t('This token is already handled in your wallet')}
          style={{ ...spacings.phSm, ...spacings.pvSm }}
        />
      ) : null}

      {isLoading || (isAdditionalHintRequested && !temporaryToken && !tokenValidation?.error) ? (
        <View style={[flexbox.alignCenter, flexbox.justifyCenter, { height: 48 }]}>
          <Spinner style={{ width: 18, height: 18 }} />
        </View>
      ) : null}
    </AddAssetBottomSheet>
  )
}

export default React.memo(AddTokenBottomSheet)
