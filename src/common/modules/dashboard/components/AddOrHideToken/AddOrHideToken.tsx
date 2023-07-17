import { NetworkId, NetworkType } from 'ambire-common/src/constants/networks'
import { UseAccountsReturnType } from 'ambire-common/src/hooks/useAccounts'
import { Token } from 'ambire-common/src/hooks/usePortfolio'
import { UsePortfolioReturnType } from 'ambire-common/src/hooks/usePortfolio/types'
import React, { useState } from 'react'
import { LayoutAnimation, TouchableOpacity, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import BottomSheet from '@common/components/BottomSheet'
import Segments from '@common/components/Segments'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { useTranslation } from '@common/config/localization'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import textStyles from '@common/styles/utils/text'

import AddOrHideTokenForm from './AddOrHideTokenForm'
import { MODES } from './constants'
import HiddenOrExtraTokens from './HiddenOrExtraTokens'
import styles from './styles'

const segments = [{ value: MODES.ADD_TOKEN }, { value: MODES.HIDE_TOKEN }]

interface Props {
  tokens: UsePortfolioReturnType['tokens']
  extraTokens: UsePortfolioReturnType['extraTokens']
  hiddenTokens: UsePortfolioReturnType['hiddenTokens']
  networkId?: NetworkId
  networkName?: NetworkType['name']
  selectedAcc: UseAccountsReturnType['selectedAcc']
  onAddExtraToken: UsePortfolioReturnType['onAddExtraToken']
  onAddHiddenToken: UsePortfolioReturnType['onAddHiddenToken']
  onRemoveExtraToken: UsePortfolioReturnType['onRemoveExtraToken']
  onRemoveHiddenToken: UsePortfolioReturnType['onRemoveHiddenToken']
}

const AddOrHideToken = ({
  tokens,
  extraTokens,
  hiddenTokens,
  networkId,
  networkName,
  selectedAcc,
  onAddExtraToken,
  onAddHiddenToken,
  onRemoveExtraToken,
  onRemoveHiddenToken
}: Props) => {
  const { t } = useTranslation()

  const { ref: sheetRef, open: openBottomSheet, close: closeBottomSheet } = useModalize()

  const [formType, setFormType] = useState<MODES>(MODES.ADD_TOKEN)

  const handleOnSubmit = (token: Token, formMode: MODES) => {
    const cases: { [key in MODES]: () => void } = {
      [MODES.ADD_TOKEN]: () => {
        onAddExtraToken(token)
        closeBottomSheet()
      },
      [MODES.HIDE_TOKEN]: () => {
        onAddHiddenToken(token)
        closeBottomSheet()
      }
    }

    return cases[formMode]()
  }

  return (
    <>
      <TouchableOpacity style={[styles.btnContainer, spacings.mbTy]} onPress={openBottomSheet}>
        <Text fontSize={14} style={{ lineHeight: 24 }}>
          {t('Add or Hide Token')}
        </Text>
      </TouchableOpacity>

      <BottomSheet id="add-token" sheetRef={sheetRef} closeBottomSheet={closeBottomSheet}>
        <Segments
          defaultValue={formType}
          segments={segments}
          onChange={(value: MODES) => {
            setFormType(value)
            triggerLayoutAnimation({
              // Animate only for iOS, because on Android it conflicts with
              // the bottom sheet backdrop animation.
              forceAnimate: false,
              config: LayoutAnimation.create(300, 'linear', 'opacity')
            })
          }}
          fontSize={14}
        />
        <View style={[flexboxStyles.flex1, flexboxStyles.justifyEnd, spacings.mtMd]}>
          {formType === MODES.ADD_TOKEN && (
            <>
              <Title type="small" style={textStyles.center}>
                {t('Add Token')}
              </Title>

              <AddOrHideTokenForm
                mode={MODES.ADD_TOKEN}
                onSubmit={handleOnSubmit}
                tokens={tokens}
                networkId={networkId}
                networkName={networkName}
              />
              <HiddenOrExtraTokens
                mode={MODES.ADD_TOKEN}
                hiddenTokens={hiddenTokens}
                extraTokens={extraTokens}
                onRemoveExtraToken={onRemoveExtraToken}
                onRemoveHiddenToken={onRemoveHiddenToken}
              />
            </>
          )}
          {formType === MODES.HIDE_TOKEN && (
            <>
              <Title type="small" style={textStyles.center}>
                {t('Hide Token')}
              </Title>

              <AddOrHideTokenForm
                enableSymbolSearch
                mode={MODES.HIDE_TOKEN}
                onSubmit={handleOnSubmit}
                tokens={tokens}
                networkId={networkId}
                networkName={networkName}
              />
              <HiddenOrExtraTokens
                mode={MODES.HIDE_TOKEN}
                hiddenTokens={hiddenTokens}
                extraTokens={extraTokens}
                onRemoveExtraToken={onRemoveExtraToken}
                onRemoveHiddenToken={onRemoveHiddenToken}
              />
            </>
          )}
        </View>
      </BottomSheet>
    </>
  )
}

export default AddOrHideToken
