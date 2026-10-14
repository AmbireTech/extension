import { setStringAsync } from 'expo-clipboard'
import React, { useCallback, useMemo } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import type { AnonRpcPreset } from '@web/extension-services/background/controllers/anon-rpc'
import { formatNetworkConfig } from '@web/extension-services/background/controllers/anon-rpc/customNetwork'
import {
  DEFAULT_SPECIFIER_CHAIN_ID,
  findSpecifierChain
} from '@web/extension-services/background/controllers/anon-rpc/specifierChains'

type Props = {
  network: AnonRpcPreset
  onCopyToCustom: (network: AnonRpcPreset) => void
}

/** Read-only view of a preset's contract address and config, so users can see what it runs. */
const NetworkDetails = ({ network, onCopyToCustom }: Props) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const configText = useMemo(() => formatNetworkConfig(network.config), [network.config])
  const chainName = useMemo(
    () =>
      findSpecifierChain(network.chainId ?? DEFAULT_SPECIFIER_CHAIN_ID)?.name ??
      String(network.chainId),
    [network.chainId]
  )

  const codeBlockStyle = useMemo(
    () => ({
      backgroundColor: theme.secondaryBackground,
      borderRadius: BORDER_RADIUS_PRIMARY,
      ...spacings.phSm,
      ...spacings.pvTy
    }),
    [theme.secondaryBackground]
  )

  const handleCopyAddress = useCallback(async () => {
    try {
      await setStringAsync(network.specifier)
      addToast(t('Address copied to clipboard'))
    } catch (error) {
      console.error('Failed to copy the privacy network address', error)
      addToast(t('Failed to copy address'), { type: 'error' })
    }
  }, [addToast, network.specifier, t])

  const handleCopyToCustom = useCallback(() => onCopyToCustom(network), [network, onCopyToCustom])

  return (
    <View style={spacings.mtSm}>
      <Text fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Contract address on {{chain}}', { chain: chainName })}
      </Text>
      <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbSm]}>
        <View style={[codeBlockStyle, flexbox.flex1]}>
          <Text fontSize={13} weight="mono_regular" selectable>
            {network.specifier}
          </Text>
        </View>
        <Button
          type="secondary"
          size="small"
          text={t('Copy')}
          onPress={handleCopyAddress}
          hasBottomSpacing={false}
          style={spacings.mlTy}
        />
      </View>
      <Text fontSize={14} weight="medium" style={spacings.mbMi}>
        {t('Configuration')}
      </Text>
      <View style={[codeBlockStyle, spacings.mbSm]}>
        {configText ? (
          <Text fontSize={13} weight="mono_regular" selectable>
            {configText}
          </Text>
        ) : (
          <Text fontSize={13} appearance="secondaryText">
            {t('None')}
          </Text>
        )}
      </View>
      <Button
        type="secondary"
        size="small"
        text={t('Copy to custom network')}
        onPress={handleCopyToCustom}
        hasBottomSpacing={false}
        style={{ alignSelf: 'flex-start' }}
      />
    </View>
  )
}

export default React.memo(NetworkDetails)
