import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import PlainAddress from '@common/components/AccountAddress/PlainAddress'
import PlainAddressWithCopy from '@common/components/AccountAddress/PlainAddressWithCopy'
import DomainBadge from '@common/components/Avatar/DomainBadge'
import Text from '@common/components/Text'
import { isMobile } from '@common/config/env'
import useHover, { AnimatedPressable } from '@common/hooks/useHover/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useReverseLookup from '@common/hooks/useReverseLookup'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Props extends ReturnType<typeof useReverseLookup> {
  address: string
  plainAddressMaxLength?: number
  withCopy?: boolean
  fontSize?: number
  containerStyle?: ViewStyle
  withReceive?: boolean
  withWrap?: boolean
}

export const ReceiveButton = memo(
  ({ address, fontSize }: { address: string; fontSize: number }) => {
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
  }
)

const AccountAddress: FC<Props> = ({
  isLoading,
  name,
  type,
  address,
  plainAddressMaxLength = 42,
  withCopy = true,
  fontSize = 12,
  containerStyle = {},
  withReceive = false,
  withWrap = false
}) => {
  const { t } = useTranslation()

  return (
    <View
      style={[{ flexShrink: 1, minWidth: 0, maxWidth: '100%' }, containerStyle]}
      testID="address"
    >
      {name || isLoading ? (
        <View
          style={[
            flexbox.directionRow,
            flexbox.alignCenter,
            withWrap ? flexbox.wrap : { flexShrink: 1, minWidth: 0, maxWidth: '100%' }
          ]}
        >
          {!isLoading ? (
            <View
              style={[
                flexbox.directionRow,
                flexbox.alignCenter,
                { flexShrink: 1, minWidth: 0, maxWidth: '100%' }
              ]}
            >
              <DomainBadge name={name} type={type} />
              <Text
                fontSize={fontSize}
                weight="semiBold"
                appearance="primary"
                numberOfLines={1}
                style={[spacings.mrMi, { flexShrink: 1, minWidth: 0 }]}
              >
                {name}
              </Text>
            </View>
          ) : (
            <Text fontSize={12} appearance="secondaryText">
              {t('Resolving domain...')}
            </Text>
          )}
          {withCopy ? (
            <>
              <PlainAddressWithCopy
                maxLength={withWrap && isMobile ? 42 : 18}
                address={address}
                fontSize={fontSize}
                withWrap={withWrap}
              >
                {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
              </PlainAddressWithCopy>
            </>
          ) : (
            <>
              <PlainAddress
                maxLength={isMobile ? 13 : 18}
                address={address}
                style={{ ...spacings.mlMi }}
                fontSize={fontSize}
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
          />
          {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
        </View>
      )}
    </View>
  )
}

export default memo(AccountAddress)
