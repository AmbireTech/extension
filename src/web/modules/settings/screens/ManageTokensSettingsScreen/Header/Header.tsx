import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import AddCircularIcon from '@common/assets/svg/AddCircularIcon'
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
        <Text appearance="secondaryText" fontSize={14}>
          {t(
            'Manage your custom and hidden tokens. These settings will be applied across all accounts.'
          )}
        </Text>
      </View>
      <Button
        testID="add-custom-token-button"
        childrenPosition="left"
        size="smaller"
        style={[spacings.phSm, { height: 40 }]}
        textStyle={{ fontSize: 12, marginTop: 2 }}
        text={t('Add custom token')}
        onPress={openAddTokenBottomSheet}
      >
        <AddCircularIcon width={20} height={20} style={spacings.mrMi} />
      </Button>
    </View>
  )
}

export default React.memo(Header)
