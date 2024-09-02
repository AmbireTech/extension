import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import getStyles from './styles'

interface Props {
  submittedAccountOp: SubmittedAccountOp
}

const SubmittedOn = ({ submittedAccountOp }: Props) => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()

  return (
    <View style={styles.footerItem}>
      <Text fontSize={14} appearance="secondaryText" weight="semiBold">
        {t('Submitted on')}:{' '}
      </Text>
      {new Date(submittedAccountOp.timestamp).toString() !== 'Invalid Date' && (
        <Text fontSize={14} appearance="secondaryText" style={spacings.mrTy}>
          {`${new Date(submittedAccountOp.timestamp).toLocaleDateString()} (${new Date(
            submittedAccountOp.timestamp
          ).toLocaleTimeString()})`}
        </Text>
      )}
    </View>
  )
}

export default React.memo(SubmittedOn)
