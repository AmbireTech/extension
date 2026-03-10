import React, { FC, memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { View, ViewStyle } from 'react-native'

import ReceiveIcon from '@common/assets/svg/ReceiveIcon'
import PlainAddress from '@common/components/AccountAddress/PlainAddress'
import PlainAddressWithCopy from '@common/components/AccountAddress/PlainAddressWithCopy'
import Text from '@common/components/Text'
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
}

const ReceiveButton = memo(({ address, fontSize }: { address: string; fontSize: number }) => {
  const [bindAnim, animStyle] = useHover({
    preset: 'opacityInverted'
  })
  const { navigate } = useNavigation()

  const handleReceive = useCallback(async () => {
    navigate(WEB_ROUTES.receive, { state: { address } })
  }, [navigate, address])

  return (
    <AnimatedPressable onPress={handleReceive} style={animStyle} {...bindAnim}>
      <ReceiveIcon width={fontSize + 8} height={fontSize + 8} style={spacings.mlMi} />
    </AnimatedPressable>
  )
})

const AccountAddress: FC<Props> = ({
  isLoading,
  ens,
  address,
  plainAddressMaxLength = 42,
  withCopy = true,
  fontSize = 12,
  containerStyle = {},
  withReceive = false
}) => {
  const { t } = useTranslation()

  return (
    <View style={[flexbox.flex1, { paddingVertical: 3 }, containerStyle]} testID="address">
      {ens || isLoading ? (
        <View style={[flexbox.flex1, flexbox.directionRow, flexbox.alignCenter]}>
          {!isLoading ? (
            <Text fontSize={fontSize} weight="semiBold" appearance="primary" numberOfLines={1}>
              {ens}
            </Text>
          ) : (
            <Text fontSize={12} appearance="secondaryText">
              {t('Resolving domain...')}
            </Text>
          )}
          {withCopy ? (
            <>
              <PlainAddressWithCopy
                maxLength={18}
                address={address}
                style={spacings.mlMi}
                fontSize={fontSize}
              >
                {withReceive && <ReceiveButton address={address} fontSize={fontSize} />}
              </PlainAddressWithCopy>
            </>
          ) : (
            <>
              <PlainAddress
                maxLength={18}
                address={address}
                style={{ ...spacings.mlMi, flex: 1 }}
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
