import { isAddress, ZeroAddress } from 'ethers'
import React, { useCallback, useMemo, useRef } from 'react'
import { View } from 'react-native'

import { getIsTokenEligibleForSwapAndBridge } from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import CoinsIcon from '@common/assets/svg/CoinsIcon'
import StarFilledIcon from '@common/assets/svg/StarFilledIcon'
import Button from '@common/components/Button'
import HoverablePressable from '@common/components/HoverablePressable'
import { SectionedSelect } from '@common/components/Select'
import Text from '@common/components/Text'
import TitleAndIcon from '@common/components/TitleAndIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import type { ISwapAndBridgeController } from '@ambire-common/interfaces/swapAndBridge'
import type { RenderSelectedOptionParams, SelectValue } from '@common/components/Select/types'

interface Props {
  toTokenOptions: SelectValue[]
  toTokenValue: SelectValue | undefined
  toTokenAmountSelectDisabled: boolean
  handleChangeToToken: (value: SelectValue) => void
  addToTokenByAddressStatus: ISwapAndBridgeController['statuses']['addToTokenByAddress']
  handleAddToTokenByAddress: (searchTerm: string) => void
  openProviderSettingsModal: () => void
}

const SECTION_MENU_HEADER_HEIGHT = 50
const TO_TOKEN_LIST_ERROR_ID = 'to-token-list-fetch-failed'

const getToTokenListErrorOption = ({
  t,
  id,
  title,
  retryToTokenList
}: {
  t: (key: string) => string
  id: string
  title: string
  retryToTokenList: () => void
}) => {
  return {
    value: id,
    label: (
      <View style={[flexbox.directionRow, flexbox.alignCenter]}>
        <Text fontSize={14} weight="medium" appearance="errorText" style={spacings.mrSm}>
          {t(title)}
        </Text>
        <Button
          type="primary"
          size="tiny"
          text={t('Retry')}
          onPress={retryToTokenList}
          hasBottomSpacing={false}
          testID="retry-to-token-list"
        />
      </View>
    ),
    icon: null
  }
}

const ToTokenSelect: React.FC<Props> = ({
  toTokenOptions,
  toTokenValue,
  toTokenAmountSelectDisabled,
  handleChangeToToken,
  addToTokenByAddressStatus,
  handleAddToTokenByAddress,
  openProviderSettingsModal
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const {
    errors,
    isTokenListLoading,
    toTokenSearchTerm,
    toChainId,
    supportedChainIds,
    swapProviders,
    disabledSwapProviderIds
  } = useController('SwapAndBridgeController').state
  const { state: portfolio } = useController('SelectedAccountController', 'portfolio')
  const [didAttemptSearchingTokenByAddress, setDidAttemptSearchingTokenByAddress] =
    React.useState(false)
  const shouldOpenProviderSettingsOnClose = useRef(false)
  const { dispatch: swapAndBridgeDispatch } = useController('SwapAndBridgeController')

  const handleAttemptToFetchMoreOptions = useCallback(
    (searchTerm: string) => {
      // Defer the state update to the next event loop iteration. This prevents the state
      // update from happening during the render phase of the parent which causes the warn:
      // Cannot update a component (ToTokenSelect) while rendering a different component (Select).
      setTimeout(() => setDidAttemptSearchingTokenByAddress(isAddress(searchTerm)), 100)

      return handleAddToTokenByAddress(searchTerm)
    },
    [handleAddToTokenByAddress]
  )

  const handleOnSearch = useCallback(
    (searchTerm: string) => {
      swapAndBridgeDispatch({
        type: 'method',
        params: { method: 'searchToToken', args: [searchTerm] }
      })
    },
    [swapAndBridgeDispatch]
  )

  const retryToTokenList = useCallback(() => {
    swapAndBridgeDispatch({
      type: 'method',
      params: { method: 'updateToTokenList', args: [false] }
    })
  }, [swapAndBridgeDispatch])

  const handleChangeToTokenOrRetry = useCallback(
    (value: SelectValue) => {
      if (value.value === TO_TOKEN_LIST_ERROR_ID) {
        retryToTokenList()
        return
      }

      handleChangeToToken(value)
    },
    [handleChangeToToken, retryToTokenList]
  )

  const isAttemptingToAddToTokenByAddress = addToTokenByAddressStatus !== 'INITIAL'
  const notFoundPlaceholderText = didAttemptSearchingTokenByAddress
    ? t('Not found. Wrong receive network?') // TODO: Add "... or unsupported token" when UI allows longer messages
    : t('Not found. Try with token address?')

  const enabledProviderNames = useMemo(
    () =>
      swapProviders
        .filter(({ id }) => !disabledSwapProviderIds.includes(id))
        .map(({ name }) => name)
        .join(', '),
    [disabledSwapProviderIds, swapProviders]
  )
  const isReceiveNetworkUnsupported =
    toChainId !== null &&
    supportedChainIds.length > 0 &&
    !supportedChainIds.includes(BigInt(toChainId))
  const shouldShowProviderSupportLink =
    isReceiveNetworkUnsupported && !!enabledProviderNames && disabledSwapProviderIds.length > 0

  const handleOpenProviderSettings = useCallback((closeTokenSelect: () => void) => {
    shouldOpenProviderSettingsOnClose.current = true
    closeTokenSelect()
  }, [])

  const handleTokenSelectClosed = useCallback(() => {
    if (!shouldOpenProviderSettingsOnClose.current) return

    shouldOpenProviderSettingsOnClose.current = false
    openProviderSettingsModal()
  }, [openProviderSettingsModal])

  const renderHeaderChildren = useCallback(
    ({ toggleMenu }: RenderSelectedOptionParams) => {
      if (!shouldShowProviderSupportLink) return null

      return (
        <HoverablePressable
          accessibilityRole="button"
          onPress={() => handleOpenProviderSettings(toggleMenu)}
          testID="receive-token-provider-settings-link"
        >
          <Text
            fontSize={14}
            weight="medium"
            color={theme.warningText}
            style={[
              spacings.phSm,
              spacings.mbTy,
              {
                textAlign: 'center',
                textDecorationColor: theme.warningText,
                textDecorationLine: 'underline'
              }
            ]}
          >
            {t('Network not supported by {{providerNames}}. Enable other providers', {
              providerNames: enabledProviderNames
            })}
          </Text>
        </HoverablePressable>
      )
    },
    [
      enabledProviderNames,
      handleOpenProviderSettings,
      shouldShowProviderSupportLink,
      t,
      theme.warningText
    ]
  )

  const toTokenListError = useMemo(() => {
    if (isTokenListLoading) return null

    return errors.find(({ id }) => id === TO_TOKEN_LIST_ERROR_ID)
  }, [errors, isTokenListLoading])

  const toTokenValueOrError = useMemo(() => {
    if (toTokenListError && !toTokenOptions.length) {
      return getToTokenListErrorOption({
        id: toTokenListError.id,
        title: toTokenListError.title,
        t,
        retryToTokenList
      })
    }

    return toTokenValue
  }, [t, retryToTokenList, toTokenListError, toTokenOptions.length, toTokenValue])

  const selectSections = useMemo(() => {
    const { toTokenOptionsInAccount, restToTokenOptions } = toTokenOptions.reduce<{
      toTokenOptionsInAccount: SelectValue[]
      restToTokenOptions: SelectValue[]
    }>(
      (acc, option) => {
        const isInPortfolioAndEligible = portfolio.tokens.some(
          (pt) =>
            pt.address === option.address &&
            pt.chainId.toString() === option.chainId.toString() &&
            getIsTokenEligibleForSwapAndBridge(pt)
        )

        isInPortfolioAndEligible
          ? acc.toTokenOptionsInAccount.push(option)
          : acc.restToTokenOptions.push(option)

        return acc
      },
      { toTokenOptionsInAccount: [], restToTokenOptions: [] }
    )

    // Note: this is a workaround to ensure the native token is always at the top of the list
    const nativeTokenIndex = restToTokenOptions.findIndex(
      (option) => option.address === ZeroAddress
    )

    if (nativeTokenIndex > 0) {
      const [popularNativeToken] = restToTokenOptions.splice(nativeTokenIndex, 1)
      if (popularNativeToken) restToTokenOptions.unshift(popularNativeToken)
    }

    if (toTokenListError) {
      restToTokenOptions.unshift(
        getToTokenListErrorOption({
          id: toTokenListError.id,
          title: toTokenListError.title,
          t,
          retryToTokenList
        })
      )
    }

    return [
      {
        title: {
          icon: CoinsIcon,
          text: toTokenSearchTerm
            ? t('Tokens found in current account')
            : t('Tokens in current account')
        },
        data: toTokenOptionsInAccount,
        key: 'swap-and-bridge-to-account-tokens'
      },
      {
        title: {
          icon: StarFilledIcon,
          text: toTokenSearchTerm ? t('Search results') : t('Popular tokens')
        },
        data: restToTokenOptions,
        key: 'swap-and-bridge-to-service-provider-tokens'
      }
    ]
  }, [toTokenOptions, toTokenListError, t, portfolio.tokens, retryToTokenList, toTokenSearchTerm])

  const renderFeeOptionSectionHeader = useCallback(
    ({ section }: any) => {
      if (section.data.length === 0 || !section.title) return null

      return (
        <TitleAndIcon
          icon={section.title.icon}
          title={section.title.text}
          style={{ backgroundColor: theme.primaryBackground }}
        />
      )
    },
    [theme.primaryBackground]
  )

  return (
    <SectionedSelect
      setValue={handleChangeToTokenOrRetry}
      mode="bottomSheet"
      bottomSheetTitle={t('Receive token')}
      renderHeaderChildren={renderHeaderChildren}
      onBottomSheetClosed={handleTokenSelectClosed}
      sections={selectSections}
      renderSectionHeader={renderFeeOptionSectionHeader}
      value={toTokenValueOrError}
      headerHeight={SECTION_MENU_HEADER_HEIGHT}
      disabled={toTokenAmountSelectDisabled}
      testID="to-token-select"
      searchPlaceholder={t('Token name or address...')}
      // menuLeftHorizontalOffset={285}
      emptyListPlaceholderText={
        isAttemptingToAddToTokenByAddress ? t('Pulling token details...') : notFoundPlaceholderText
      }
      attemptToFetchMoreOptions={handleAttemptToFetchMoreOptions}
      onSearch={handleOnSearch}
      containerStyle={{
        ...spacings.mb0,
        ...flexbox.flex1,
        ...spacings.mrMd
      }}
      selectStyle={{ ...spacings.plTy, ...spacings.prSm }}
      stickySectionHeadersEnabled
    />
  )
}

export default React.memo(ToTokenSelect)
