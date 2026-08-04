import React, { FC } from 'react'
import { View } from 'react-native'

import { TokenResult } from '@ambire-common/libs/portfolio'
import Button from '@common/components/Button'
import NetworkIcon from '@common/components/NetworkIcon'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useManageToken from '@common/modules/settings/hooks/useManageToken'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  token: TokenResult
  onTokenPreferenceOrCustomTokenChange: () => void
}

const Token: FC<Props> = ({ token, onTokenPreferenceOrCustomTokenChange }) => {
  const { address, chainId, flags, symbol } = token
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { networks } = useController('NetworksController').state
  const { isHidden, toggleHideToken, removeCustomToken } = useManageToken({
    address,
    chainId,
    onTokenPreferenceOrCustomTokenChange
  })

  const networkName =
    networks.find(({ chainId: nChainId }) => nChainId === chainId)?.name || t('Unknown network')

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.alignCenter,
        flexbox.justifySpaceBetween,
        common.borderRadiusPrimary,
        spacings.phTy,
        spacings.pvTy,
        spacings.mbTy,
        { backgroundColor: theme.secondaryBackground }
      ]}
    >
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.flex1, spacings.mrTy]}>
        <TokenIcon
          withContainer
          address={address}
          chainId={chainId}
          onGasTank={flags.onGasTank}
          containerHeight={32}
          containerWidth={32}
          width={28}
          height={28}
        />
        <View style={[flexbox.flex1, spacings.mlTy]}>
          <Text testID="hidden-token-name" fontSize={14} weight="medium" numberOfLines={1}>
            {symbol}
          </Text>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <NetworkIcon size={16} id={chainId.toString()} style={spacings.mrMi} />
            <Text
              testID="hidden-token-network"
              fontSize={12}
              appearance="secondaryText"
              numberOfLines={1}
            >
              {networkName}
            </Text>
          </View>
        </View>
      </View>
      <Button
        testID={isHidden ? 'unhide-button' : 'remove-button'}
        type="secondary"
        size="small"
        // The button sits on the row's secondaryBackground, so it needs the
        // background the web button gets on hover to stand out
        style={{ width: 88, backgroundColor: theme.tertiaryBackground }}
        text={isHidden ? t('Unhide') : t('Remove')}
        onPress={isHidden ? toggleHideToken : removeCustomToken}
        hasBottomSpacing={false}
      />
    </View>
  )
}

export default React.memo(Token)
