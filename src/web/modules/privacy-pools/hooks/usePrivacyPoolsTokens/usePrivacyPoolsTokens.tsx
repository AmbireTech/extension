import { formatUnits } from 'ethers'
import React, { memo, useMemo } from 'react'
import { SectionListData, View } from 'react-native'

import {
  getPrivacyPoolsDepositId,
  getPrivacyPoolsTokenId
} from '@ambire-common/consts/privacyPools'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import type usePrivacyPools from '@web/modules/privacy-pools/hooks/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const TOKEN_ICON_CONTAINER_SIZE = 32
const TOKEN_ICON_SIZE = 28
/** A deposit row is lower than a token's, as it holds one line of text. */
export const PRIVACY_POOLS_DEPOSIT_OPTION_HEIGHT = 40
const TOKEN_SECTION_HEADER_HEIGHT = 50
/** Moves a deposit's text under its token's symbol, past the token icon and its spacing. */
const DEPOSIT_INDENT_STYLE = { paddingLeft: TOKEN_ICON_CONTAINER_SIZE + 8 }

export type PrivacyPoolsTokenOption = SelectValue & {
  // Each chain has its own pools and entrypoint
  chainId: string
  tokenAddress: string
  isNative: boolean
  symbol: string
  decimals: number
  // The deposit it sends from, as a send spends exactly one - see
  // `PrivacyPoolsSendableDeposit.number`
  depositNumber: number
  // What is left in the deposit in raw units, all of which can be sent now, for validating the
  // typed amount. A deposit with a send on its way is left out of the list instead
  availableAmount: bigint
}

/** A token on one network, listing its deposits that can be sent. */
type PrivacyPoolsTokenSection = {
  key: string
  chainId: string
  tokenAddress: string
  symbol: string
  networkName: string
  /** What all of the token's deposits can send, formatted. */
  totalAmount: string
  data: PrivacyPoolsTokenOption[]
}

const selectSendableDeposits = (state: AllControllersMappingType['PrivacyPoolsController']) =>
  state.sendableDeposits

const formatAmount = (amount: bigint, decimals: number) =>
  formatDecimals(Number(formatUnits(amount, decimals)), 'amount')

const TokenIconWithNetwork = ({
  chainId,
  tokenAddress
}: {
  chainId: string
  tokenAddress: string
}) => (
  <TokenIcon
    chainId={BigInt(chainId)}
    address={tokenAddress}
    withContainer
    // Tells same-symbol entries on different networks apart
    withNetworkIcon
    containerWidth={TOKEN_ICON_CONTAINER_SIZE}
    containerHeight={TOKEN_ICON_CONTAINER_SIZE}
    width={TOKEN_ICON_SIZE}
    height={TOKEN_ICON_SIZE}
  />
)

/** A token, its network and what all of its deposits can send, above the deposits. */
const TokenSectionHeaderComponent = ({ section }: { section: PrivacyPoolsTokenSection }) => {
  const { theme } = useTheme()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        spacings.ph,
        // Opaque, as it stays on top of the deposits scrolling under it
        { height: TOKEN_SECTION_HEADER_HEIGHT, backgroundColor: theme.primaryBackground }
      ]}
    >
      <View style={spacings.mrTy}>
        <TokenIconWithNetwork chainId={section.chainId} tokenAddress={section.tokenAddress} />
      </View>
      <View style={flexbox.flex1}>
        <Text fontSize={16} weight="medium" numberOfLines={1}>
          {section.symbol}
        </Text>
        <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
          {section.networkName}
        </Text>
      </View>
      <Text fontSize={14} weight="number_medium" numberOfLines={1} style={spacings.mlSm}>
        {section.totalAmount}
      </Text>
    </View>
  )
}

const TokenSectionHeader = memo(TokenSectionHeaderComponent)

/** Draws a token's header, or nothing when a search left none of its deposits. */
export const renderPrivacyPoolsTokenSectionHeader = ({
  section
}: {
  section: SectionListData<SelectValue>
}) => {
  if (!section.data.length) return null

  // The sections are built below as `PrivacyPoolsTokenSection`s
  return <TokenSectionHeader section={section as unknown as PrivacyPoolsTokenSection} />
}

/** Zero for a token a search left without deposits, as its header is not drawn. */
export const getPrivacyPoolsTokenSectionHeaderHeight = (section: SectionListData<SelectValue>) =>
  section.data.length ? TOKEN_SECTION_HEADER_HEIGHT : 0

/**
 * Send form token options: one per deposit, as a send spends exactly one, and only approved ones,
 * as pending ones cannot be sent.
 *
 * - `withdrawTokens` is what the select shows once one is picked: the token with the deposit beside
 *   it, like "ETH #7", and the network, like "on Ethereum".
 * - `withdrawTokenSections` is the list to pick from: each token once, with what it can send in
 *   total, and its deposits under it. Its options share their `value` with `withdrawTokens`.
 */
const usePrivacyPoolsTokens = ({
  getNetworkName
}: Pick<ReturnType<typeof usePrivacyPools>, 'getNetworkName'>) => {
  const { t } = useTranslation()
  const { state: sendableDeposits } = useController(
    'PrivacyPoolsController',
    selectSendableDeposits
  )

  const withdrawTokenSections: PrivacyPoolsTokenSection[] = useMemo(
    () =>
      Object.entries(sendableDeposits || {}).flatMap(([chainId, deposits]) => {
        const networkName = getNetworkName(chainId)
        const sectionsByToken = new Map<string, PrivacyPoolsTokenSection>()
        const totalsByToken = new Map<string, bigint>()

        deposits.forEach((deposit) => {
          const key = getPrivacyPoolsTokenId(chainId, deposit.tokenAddress)
          const section = sectionsByToken.get(key) ?? {
            key,
            chainId,
            tokenAddress: deposit.tokenAddress,
            symbol: deposit.symbol,
            networkName,
            totalAmount: '',
            data: []
          }
          const amount = formatAmount(deposit.availableAmount, deposit.decimals)
          const depositTitle = t('Deposit #{{number}}', { number: deposit.number })

          const total = (totalsByToken.get(key) ?? 0n) + deposit.availableAmount
          totalsByToken.set(key, total)
          section.totalAmount = formatAmount(total, deposit.decimals)
          section.data.push({
            value: getPrivacyPoolsDepositId(chainId, deposit.tokenAddress, deposit.number),
            chainId,
            tokenAddress: deposit.tokenAddress,
            isNative: deposit.isNative,
            symbol: deposit.symbol,
            decimals: deposit.decimals,
            depositNumber: deposit.number,
            availableAmount: deposit.availableAmount,
            extraSearchProps: {
              symbol: deposit.symbol,
              address: deposit.tokenAddress,
              network: networkName
            },
            label: (
              <View
                style={[
                  flexbox.directionRow,
                  flexbox.alignCenter,
                  flexbox.flex1,
                  DEPOSIT_INDENT_STYLE
                ]}
              >
                <Text
                  fontSize={14}
                  appearance="secondaryText"
                  numberOfLines={1}
                  style={flexbox.flex1}
                >
                  {depositTitle}
                </Text>
                <Text fontSize={14} weight="number_regular" numberOfLines={1} style={spacings.mlSm}>
                  {amount}
                </Text>
              </View>
            )
          })
          sectionsByToken.set(key, section)
        })

        return Array.from(sectionsByToken.values())
      }),
    [sendableDeposits, getNetworkName, t]
  )

  const withdrawTokens: PrivacyPoolsTokenOption[] = useMemo(
    () =>
      withdrawTokenSections.flatMap(({ networkName, data }) =>
        data.map((option) => ({
          ...option,
          icon: (
            <TokenIconWithNetwork chainId={option.chainId} tokenAddress={option.tokenAddress} />
          ),
          // No amount here, as the field already shows what the deposit can send beside Max
          label: (
            <View style={flexbox.flex1}>
              <Text fontSize={16} weight="medium" numberOfLines={1}>
                {`${option.symbol} #${option.depositNumber}`}
              </Text>
              <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
                {t('on {{networkName}}', { networkName })}
              </Text>
            </View>
          )
        }))
      ),
    [withdrawTokenSections, t]
  )

  return { withdrawTokens, withdrawTokenSections }
}

export default usePrivacyPoolsTokens
