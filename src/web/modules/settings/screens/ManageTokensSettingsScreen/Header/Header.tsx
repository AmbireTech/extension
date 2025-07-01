import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddIcon from '@common/assets/svg/AddIcon'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  openAddTokenBottomSheet: () => void
}

const Header: FC<Props> = ({ openAddTokenBottomSheet }) => {
  const { t } = useTranslation()

  return (
    <View
      style={[
        flexbox.directionRow,
        flexbox.justifySpaceBetween,
        flexbox.alignCenter,
        spacings.mbXl
      ]}
    >
      <View style={{ maxWidth: 512 }}>
        <Text appearance="primaryText" fontSize={20} style={spacings.mbMi} weight="medium">
          {t('Custom and hidden tokens')}
        </Text>
        <Text appearance="secondaryText">
          {t(
            'Manage your custom and hidden tokens. These settings will be applied across all accounts.'
          )}
        </Text>
      </View>
      <Button
        childrenPosition="left"
        style={{ width: 220 }}
        text={t('Add custom token')}
        onPress={openAddTokenBottomSheet}
      >
        <AddIcon width={22} height={22} style={spacings.mrTy} />
      </Button>
    </View>
  )
}

export default React.memo(Header)
