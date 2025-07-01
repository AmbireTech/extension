import { Hex } from '@ambire-common/interfaces/hex'
import AlertVertical from '@common/components/AlertVertical'
import Button from '@common/components/Button'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

type FailedProps = {
  title: string
  errorMessage: string
  toToken?: {
    chainId: string
    address: Hex
  }
  amount?: string
  handleClose: () => void
}

const Failed: FC<FailedProps> = ({ title, errorMessage, toToken, amount, handleClose }) => {
  const { t } = useTranslation()
  const { dispatch } = useBackgroundService()

  return (
    <View>
      <View
        style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyCenter, spacings.mbLg]}
      >
        <AlertVertical title={title} text={errorMessage} />
      </View>
      {toToken && amount && (
        <Button
          onPress={() => {
            dispatch({
              type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
              params: {
                toSelectedTokenAddr: toToken.address,
                toChainId: BigInt(toToken.chainId),
                fromAmount: amount
              }
            })
            handleClose()
          }}
          type="primary"
          text={t('Retry')}
        />
      )}
    </View>
  )
}

export default Failed
