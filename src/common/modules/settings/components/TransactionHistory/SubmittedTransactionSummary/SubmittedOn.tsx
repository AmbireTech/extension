import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import NetworkBadge from '@common/components/NetworkBadge'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

interface Props {
  timestamp: SubmittedAccountOp['timestamp']
  fontSize?: number
  iconSize?: number
  chainId: bigint
  numberOfLines?: 1 | 2
}

const { isPopup } = getUiType()

const SubmittedOn = ({
  timestamp,
  fontSize = 14,
  iconSize = 32,
  chainId,
  numberOfLines = 2
}: Props) => {
  const { t } = useTranslation()
  const date = new Date(timestamp)

  return (
    <View
      style={[
        spacings.mrSm,
        { flex: 1.5 },
        numberOfLines === 1 && flexbox.directionRow,
        numberOfLines === 1 && flexbox.alignCenter
      ]}
    >
      <Text
        fontSize={fontSize}
        appearance="secondaryText"
        weight="semiBold"
        style={{
          display: 'flex',
          ...flexbox.alignCenter,
          ...flexbox.directionRow,
          ...spacings.mbMi
        }}
      >
        {t('Submitted ')}

        <NetworkBadge
          chainId={chainId}
          withOnPrefix
          fontSize={fontSize}
          weight="semiBold"
          style={{
            ...spacings.pv0,
            ...spacings.pl0,
            ...spacings.pr0,
            borderWidth: 0,
            height: 'auto'
          }}
          iconSize={iconSize}
          iconStyle={spacings.mlMi}
          renderNetworkName={(networkName) => {
            if (isPopup)
              return networkName.length > 7 ? `${networkName.slice(0, 7)}...` : networkName

            return networkName
          }}
        />
      </Text>

      {date.toString() !== 'Invalid Date' && (
        <Text fontSize={fontSize} appearance="secondaryText" style={spacings.mrTy}>
          {`${date.toLocaleDateString()} (${date.toLocaleTimeString()})`}
        </Text>
      )}
    </View>
  )
}

export default React.memo(SubmittedOn)
