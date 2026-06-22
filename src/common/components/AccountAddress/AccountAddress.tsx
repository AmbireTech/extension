import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import { getTimeAgo } from '@ambire-common/services/validations/validate'
import EnsIcon from '@common/assets/svg/EnsIcon'
import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import PlainAddress from '@common/components/AccountAddress/PlainAddress'
import PlainAddressWithCopy from '@common/components/AccountAddress/PlainAddressWithCopy'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import { createGlobalTooltipDataSet } from '@common/components/GlobalTooltip'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useHover, { AnimatedPressable } from '@common/hooks/useHover/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useReverseLookup from '@common/hooks/useReverseLookup'
import useTheme from '@common/hooks/useTheme'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props extends Omit<ReturnType<typeof useReverseLookup>, 'updatedAt' | 'isFetched'> {
  // Optional so callers that don't run a reverse lookup (e.g. receive screens) can omit them.
  // The "no ENS data" icon only shows when `isFetched` is explicitly false.
  updatedAt?: number
  isFetched?: boolean
  address: string
  plainAddressMaxLength?: number
  addressHighlight?: {
    prefix: number
    suffix: number
    color: 'errorText'
  }
  withCopy?: boolean
  fontSize?: number
  containerStyle?: ViewStyle
  withReceive?: boolean
  withWrap?: boolean
}

export const ReceiveButton = memo(function ReceiveButton({
  address,
  fontSize
}: {
  address: string
  fontSize: number
}) {
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })
  const { navigate } = useNavigation()

  const handleReceive = useCallback(async () => {
    navigate(WEB_ROUTES.receive, { state: { address } })
  }, [navigate, address])

  const size = useMemo(() => fontSize + 8, [fontSize])

  return (
    <AnimatedPressable onPress={handleReceive} style={[spacings.mlTy, animStyle]} {...bindAnim}>
      <ReceiveIcon width={size} height={size} strokeWidth={size < 24 ? '1.5' : '1.2'} />
    </AnimatedPressable>
  )
})

const AccountAddress: FC<Props> = ({
  isLoading,
  name,
  type,
  updatedAt,
  isFetched,
  address,
  plainAddressMaxLength = 42,
  addressHighlight,
  withCopy = true,
  fontSize = 12,
  containerStyle = {},
  withReceive = false,
  withWrap = false
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  // If highlight is required, prioritize showing it over domain resolving/name UI so the highlight stays visible.
  const effectiveIsLoading = isLoading && !addressHighlight
  const showResolvedName = !!name && !addressHighlight
  // Reverse lookup never ran for this address (e.g. lists use the `never` privacy mode and serve from cache only)
  const showNoEnsData = isFetched === false && !effectiveIsLoading && !addressHighlight
  // It's okay to use Date.now() here because we don't have to sync the time
  // (the user won't stay on this screen for long enough for the time to change significantly)
  // eslint-disable-next-line react-hooks/purity
  const isEnsOlderThanOneDay = updatedAt ? Date.now() - updatedAt > 18 * 60 * 60 * 1000 : false

  const nameTooltipContent = useMemo(() => {
    if (!name) return ''
    if (!updatedAt) return name

    return `${name} (${t('Updated {{timeAgo}}', { timeAgo: getTimeAgo(new Date(updatedAt)) })})`
  }, [name, updatedAt, t])

  return (
    <View
      style={[{ flexShrink: 1, minWidth: 0, maxWidth: '100%' }, containerStyle]}
      testID="address"
    >
      {showResolvedName || effectiveIsLoading || showNoEnsData ? (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            withWrap ? flexbox.wrap : { flexShrink: 1, minWidth: 0, maxWidth: '100%' }
          ]}
        >
          {showResolvedName ? (
            <>
              <DomainBadge
                name={name}
                type={type}
                color={isEnsOlderThanOneDay ? theme.iconPrimary : undefined}
              />
              <Text
                fontSize={fontSize}
                weight="semiBold"
                appearance={isEnsOlderThanOneDay ? 'secondaryText' : 'primary'}
                numberOfLines={1}
                style={[spacings.mrMi, { flexShrink: 1, minWidth: 0 }]}
                dataSet={createGlobalTooltipDataSet({
                  id: `account-address-resolved-name-${address}`,
                  content: nameTooltipContent
                })}
              >
                {name}
              </Text>
            </>
          ) : effectiveIsLoading ? (
            <Text fontSize={12} appearance="secondaryText">
              {t('Resolving domain...')}
            </Text>
          ) : showNoEnsData ? (
            <View
              style={{ zIndex: 2, ...spacings.mrMi }}
              dataSet={createGlobalTooltipDataSet({
                id: `account-address-no-ens-${address}`,
                content: t('No ENS data. Select the account to update')
              })}
            >
              <EnsIcon width={16} height={16} color={theme.iconPrimary} state="none" />
            </View>
          ) : null}
          {withCopy ? (
            <>
              <PlainAddressWithCopy
                maxLength={addressHighlight || withWrap ? 42 : isMobile ? 42 : 16}
                address={address}
                fontSize={fontSize}
                withWrap={withWrap}
                highlight={addressHighlight}
              >
                {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
              </PlainAddressWithCopy>
            </>
          ) : (
            <>
              <PlainAddress
                maxLength={isMobile ? 13 : 16}
                address={address}
                style={{ ...spacings.mlMi }}
                fontSize={fontSize}
                withWrap={withWrap}
                highlight={addressHighlight}
              />
              {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
            </>
          )}
        </View>
      ) : withCopy ? (
        <>
          <PlainAddressWithCopy
            maxLength={plainAddressMaxLength}
            address={address}
            hideParentheses
            fontSize={fontSize}
            withWrap={withWrap}
            highlight={addressHighlight}
          >
            {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
          </PlainAddressWithCopy>
        </>
      ) : (
        <View style={[flexbox.directionRow]}>
          <PlainAddress
            maxLength={plainAddressMaxLength}
            address={address}
            hideParentheses
            fontSize={fontSize}
            withWrap={withWrap}
            highlight={addressHighlight}
          />
          {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
        </View>
      )}
    </View>
  )
}

export default memo(AccountAddress)
