import networks from 'ambire-common/src/constants/networks'
import * as Clipboard from 'expo-clipboard'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'

import CopyIcon from '@common/assets/svg/CopyIcon'
import NetworkIcon from '@common/components/NetworkIcon'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isRelayerless } from '@common/config/env'
import useToast from '@common/hooks/useToast'
import colors from '@common/styles/colors'
import spacings, { DEVICE_WIDTH } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import styles from './styles'

interface Props {
  networkId?: string
  selectedAcc: string
}

const DepositTokens = ({ selectedAcc, networkId }: Props) => {
  const { t } = useTranslation()
  const qrCodeRef: any = useRef(null)
  const { addToast } = useToast()
  const networkDetails = useMemo(() => networks.find(({ id }) => id === networkId), [networkId])
  const [qrCodeError, setQrCodeError] = useState<string | boolean | null>(null)

  const handleCopyAddress = () => {
    Clipboard.setStringAsync(selectedAcc)
    addToast(t('Address copied to clipboard!') as string, { timeout: 2500 })
  }

  return (
    <>
      <Title hasBottomSpacing={false} style={[textStyles.center, spacings.mbTy]}>
        {t('Deposit Tokens')}
      </Title>
      <Panel style={spacings.mb0}>
        <Text style={spacings.mbSm} fontSize={16} weight="medium" color={colors.turquoise}>
          {t('Direct Deposit')}
        </Text>
        <Text style={[spacings.mbTy, spacings.ph]} fontSize={12}>
          {t('Send {{symbol}}, tokens or collectibles (NFTs) to this address:', {
            symbol: networkDetails?.nativeAssetSymbol
          })}
        </Text>
        <TouchableOpacity
          style={styles.addressCopyContainer}
          activeOpacity={0.7}
          onPress={handleCopyAddress}
        >
          <Text
            numberOfLines={1}
            fontSize={14}
            ellipsizeMode="middle"
            style={[spacings.prSm, flexboxStyles.flex1]}
          >
            {selectedAcc}
          </Text>
          <CopyIcon />
        </TouchableOpacity>
        <View style={[flexboxStyles.alignCenter, spacings.pt, spacings.pbTy]}>
          {!!selectedAcc && !qrCodeError && (
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={selectedAcc}
                size={200}
                quietZone={10}
                getRef={qrCodeRef}
                onError={() => setQrCodeError(t('Failed to load QR code!') as string)}
              />
            </View>
          )}
          {!!qrCodeError && <Text appearance="danger">{qrCodeError}</Text>}
        </View>
      </Panel>
      <View style={[flexboxStyles.alignCenter, spacings.mb]}>
        <Text fontSize={12} style={[spacings.mbMi, textStyles.center]}>
          {t('Following networks supported on this address:')}
        </Text>
        <View style={styles.supportedNetworksContainer}>
          {networks
            .filter(({ hide }) => !hide)
            .filter((n) => isRelayerless || !n.relayerlessOnly)
            .map(({ id, name }: any) => (
              <View key={id} style={styles.supportedNetworksItem}>
                <View style={{ marginBottom: 3 }}>
                  <NetworkIcon name={id} type="monochrome" />
                </View>
                <Text
                  style={spacings.plMi}
                  fontSize={10}
                  numberOfLines={1}
                  color={colors.waikawaGray}
                >
                  {name}
                </Text>
              </View>
            ))}
        </View>
      </View>
    </>
  )
}

export default React.memo(DepositTokens)
