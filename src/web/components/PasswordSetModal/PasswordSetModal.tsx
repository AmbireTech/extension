import React, { FC } from 'react'
import { useTranslation } from 'react-i18next'

import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_3XL } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import KeyStoreLogo from '@web/modules/keystore/components/KeyStoreLogo'

interface Props {
  modalRef: any
  onPress: () => void
}

const PasswordSetModal: FC<Props> = ({ modalRef, onPress }) => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  return (
    <BottomSheet
      backgroundColor={themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'}
      id="password-set-modal"
      sheetRef={modalRef}
      autoWidth
      shouldBeClosableOnDrag={false}
      style={{ paddingHorizontal: SPACING_3XL * 2, ...spacings.pv4Xl }}
    >
      <Text weight="medium" fontSize={20} style={[text.center, spacings.mbXl]}>
        {t('Extension password')}
      </Text>
      <KeyStoreLogo width={112} height={112} style={[flexbox.alignSelfCenter, spacings.mbXl]} />
      <Text fontSize={16} style={[spacings.mb2Xl, text.center]}>
        {t('Your extension password is set!')}
      </Text>
      <Button
        text={t('Continue')}
        hasBottomSpacing={false}
        style={{ minWidth: 232 }}
        onPress={onPress}
      >
        <RightArrowIcon style={spacings.ml} />
      </Button>
    </BottomSheet>
  )
}

export default PasswordSetModal
