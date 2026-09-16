import React from 'react'
import { useTranslation } from 'react-i18next'

import AddressSelect, { AddressSelectProps } from '@common/components/AddressSelect'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import { ItemPanel } from '@web/components/TransactionsScreen'

import type { TokenResult } from '@ambire-common/libs/portfolio'

interface Props extends AddressSelectProps {
  selectedTokenSymbol?: TokenResult['symbol']
}

// The transfer flow's recipient field: an AddressSelect presented as a labelled panel.
const Recipient: React.FC<Props> = (props) => {
  const { t } = useTranslation()

  return (
    <ItemPanel style={{ ...spacings.pbTy, ...spacings.mbTy }}>
      <Text appearance="secondaryText" fontSize={14} weight="medium" style={[spacings.mbSm]}>
        {t('Add recipient')}
      </Text>
      <AddressSelect {...props} bottomSheetTitle={t('Add recipient')} />
    </ItemPanel>
  )
}

export default React.memo(Recipient)
