import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import TransferIcon from '@common/assets/svg/TransferIcon'
import BottomSheet from '@common/components/BottomSheet'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'
import useExtension from '@web/hooks/useExtension'

import ConnectedWeb3DAppItem from './ConnectedWeb3DAppItem'

const ConnectedDapps = ({ isIcon = false }: { isIcon?: boolean }) => {
  const { t } = useTranslation()
  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()
  const { connectedDapps, disconnectDapp } = useExtension()

  return (
    <>
      <TouchableOpacity onPress={openBottomSheet}>
        {!!isIcon && (
          <View style={[flexboxStyles.alignCenter, flexboxStyles.justifyCenter]}>
            <TransferIcon />
            <Text fontSize={9}>{t('dApps')}</Text>
          </View>
        )}
        {!isIcon && (
          <Text style={spacings.mbSm} color={colors.titan_50}>
            {t('Connected dApps')}
          </Text>
        )}
      </TouchableOpacity>
      <BottomSheet id="connected-dapps" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <Title style={[textStyles.center, spacings.mt]}>{t('Connected dApps')}</Title>

        {!connectedDapps.length && (
          <View style={spacings.mb}>
            <Text style={textStyles.center}>
              {t(
                "You have no connected dApps. To connect, find and click the connect button on the dApp's webpage."
              )}
            </Text>
          </View>
        )}
        {!!connectedDapps.length &&
          connectedDapps.map(({ origin, name, icon, isConnected }, i: number) => {
            return (
              <ConnectedWeb3DAppItem
                key={origin}
                name={name}
                icon={icon}
                origin={origin}
                isConnected={isConnected}
                disconnectDapp={disconnectDapp}
                isLast={connectedDapps.length - 1 === i}
              />
            )
          })}
      </BottomSheet>
    </>
  )
}

export default React.memo(ConnectedDapps)
