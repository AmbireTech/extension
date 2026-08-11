import React, { useCallback } from 'react'
import { View } from 'react-native'

import Button from '@common/components/Button'
import FullScreenMessage from '@common/components/FullScreenMessage'
import SupportLink from '@common/components/SupportLink'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { getUiType } from '@common/utils/uiType'
import { closeCurrentWindow } from '@web/extension-services/background/webapi/window'

const ACTION_BUTTON_WIDTH = 160

const { isRequestWindow } = getUiType()

interface Props {
  title: string
  description: string
}

/**
 * Shown when the app cannot get itself out of a state, so the user is not left looking at
 * an empty window.
 */
const RecoveryScreen = ({ title, description }: Props) => {
  const { t } = useTranslation()

  const handleReload = useCallback(() => window.location.reload(), [])

  return (
    <FullScreenMessage
      title={title}
      description={
        <Text fontSize={14} style={text.center}>
          {description} {t('If it keeps happening, please ')}
          <SupportLink />
          {t(' and we will help.')}
        </Text>
      }
      actions={
        <View style={[flexbox.directionRow, flexbox.center]}>
          {isRequestWindow && (
            <Button
              type="secondary"
              text={t('Close')}
              onPress={closeCurrentWindow}
              hasBottomSpacing={false}
              style={{ width: ACTION_BUTTON_WIDTH, ...spacings.mrTy }}
              testID="recovery-screen-close"
            />
          )}
          <Button
            text={t('Reload')}
            onPress={handleReload}
            hasBottomSpacing={false}
            style={{ width: ACTION_BUTTON_WIDTH }}
            testID="recovery-screen-reload"
          />
        </View>
      }
    />
  )
}

export default React.memo(RecoveryScreen)
