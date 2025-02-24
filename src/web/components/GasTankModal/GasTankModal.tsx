import { LinearGradient } from 'expo-linear-gradient'
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, Pressable, View } from 'react-native'

import { Account } from '@ambire-common/interfaces/account'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import InfoIcon from '@common/assets/svg/InfoIcon'
import ReceivingIcon from '@common/assets/svg/ReceivingIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import SavingsIcon from '@common/assets/svg/SavingsIcon'
import TopUpIcon from '@common/assets/svg/TopUpIcon'
import TupUpWithBgIcon from '@common/assets/svg/TupUpWithBgIcon'
import BackButton from '@common/components/BackButton'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import { calculateGasTankBalance } from '@common/utils/calculateGasTankBalance'
import { createTab } from '@web/extension-services/background/webapi/tab'
import { useCustomHover } from '@web/hooks/useHover'
import { getUiType } from '@web/utils/uiType'

import getStyles from './styles'

type Props = {
  modalRef: any
  handleClose: () => void
  portfolio: SelectedAccountPortfolio
  account: Account | null
}

type BulletContent = {
  key: string
  icon: ReactNode
  text: string
}

type Animation = { translateX: Animated.Value; opacity: Animated.Value; scale: Animated.Value }

const createAnimation = (): Animation => ({
  translateX: new Animated.Value(-50),
  opacity: new Animated.Value(0),
  scale: new Animated.Value(0.8)
})

const GasTankModal = ({ modalRef, handleClose, portfolio, account }: Props) => {
  const { isPopup } = getUiType()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const [bindAnim, , isHovered] = useCustomHover({
    property: 'borderColor',
    values: {
      from: 'transparent',
      to: theme.primary
    }
  })

  const isSA = useMemo(() => isSmartAccount(account), [account])

  const savedInUsd = useMemo(
    () => calculateGasTankBalance(portfolio, account, isSA, 'saved'),
    [account, isSA, portfolio]
  )
  const cashbackInUsd = useMemo(
    () => calculateGasTankBalance(portfolio, account, isSA, 'cashback'),
    [account, isSA, portfolio]
  )
  const gasTankTotalBalanceInUsd = useMemo(
    () => calculateGasTankBalance(portfolio, account, isSA, 'usd'),
    [account, isSA, portfolio]
  )

  const [visibleCount, setVisibleCount] = useState(0)
  const [animations, setAnimations] = useState<Animation[]>([])

  const bulletsContent: BulletContent[] = useMemo(
    () => [
      {
        key: 'top-up',
        icon: <TupUpWithBgIcon width={32} height={32} />,
        text: 'Top up on any chain and use Gas Tank to pay network fees on any other.'
      },
      {
        key: 'receive-cashback',
        icon: <ReceivingIcon width={32} height={32} fillColor={theme.primary} />,
        text: 'Receive cashback from your transactions in your Gas Tank.'
      },
      {
        key: 'save',
        icon: (
          <SavingsIcon width={32} height={32} color="white" fillColor={theme.successDecorative} />
        ),
        text: 'Save on network fees by prepaying with Gas Tank.'
      }
    ],
    [theme.successDecorative, theme.primary]
  )

  useEffect(() => {
    // Initialize animations for each bullet
    setAnimations(bulletsContent.map(() => createAnimation()))
  }, [bulletsContent])

  const handleOpen = useCallback(() => {
    setVisibleCount(0) // Reset visible count
    animations.forEach((animation) => {
      animation.translateX.setValue(-50) // Reset off-screen
      animation.opacity.setValue(0) // Reset invisible
      animation.scale.setValue(0.8) // Reset scale
    })
    setTimeout(() => {
      bulletsContent.forEach((_, index) => {
        Animated.parallel([
          Animated.timing(animations[index].translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(animations[index].opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.spring(animations[index].scale, {
            toValue: 1,
            useNativeDriver: true
          })
        ]).start()
        setVisibleCount((prev) => prev + 1)
      })
    }, 500) // Wait for modal animation
  }, [animations, bulletsContent])

  return (
    <BottomSheet
      id="gas-tank-modal"
      type={isPopup ? 'bottom-sheet' : 'modal'}
      sheetRef={modalRef}
      backgroundColor="secondaryBackground"
      containerInnerWrapperStyles={styles.containerInnerWrapper}
      closeBottomSheet={handleClose}
      style={{ maxWidth: 600 }}
      onOpen={handleOpen}
    >
      {isSA ? (
        <View style={styles.content}>
          <Text fontSize={20} weight="medium">
            Gas Tank
          </Text>
          <View>
            <View style={styles.balancesWrapper}>
              <View style={{ ...flexbox.alignStart }}>
                <Text fontSize={12} appearance="secondaryText" style={{ ...spacings.pbTy }}>
                  {t('Gas Tank Balance')}
                </Text>
                <View style={{ ...flexbox.directionRow, ...flexbox.alignCenter }}>
                  <GasTankIcon height={40} width={40} />
                  <Text fontSize={32} weight="number_bold" appearance="primaryText">
                    {formatDecimals(gasTankTotalBalanceInUsd, 'price')}
                  </Text>
                </View>
              </View>
              <View style={styles.rightPartWrapper}>
                <View style={styles.rightPartInnerWrapper}>
                  <Text fontSize={12} appearance="successText" style={spacings.mrTy}>
                    {t('Total Saved')}:
                  </Text>
                  <Text fontSize={14} appearance="successText">
                    {formatDecimals(savedInUsd, 'price')}
                  </Text>
                </View>
                <View style={styles.rightPartInnerWrapper}>
                  <Text fontSize={12} appearance="primary" style={spacings.mrTy}>
                    {t('Total Cashback')}:
                  </Text>
                  <Text fontSize={14} appearance="primary">
                    {formatDecimals(cashbackInUsd, 'price')}
                  </Text>
                </View>
              </View>
            </View>
            <View>
              <Pressable
                onPress={async () => {
                  try {
                    await createTab(
                      'https://help.ambire.com/hc/en-us/articles/5397969913884-What-is-the-Gas-Tank'
                    )
                  } catch {
                    addToast("Couldn't open link", { type: 'error' })
                  }
                }}
                style={[
                  styles.descriptionTextWrapper,
                  {
                    borderColor: isHovered ? theme.primary : 'transparent'
                  }
                ]}
                {...bindAnim}
              >
                <View style={[flexbox.directionRow]}>
                  <InfoIcon width={20} />
                  <Text style={spacings.mlMd} weight="medium" fontSize={16}>
                    {t('Learn more about Gas Tank')}
                  </Text>
                </View>
                <RightArrowIcon />
              </Pressable>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth]}>
            <Text fontSize={20} weight="medium">
              Gas Tank
            </Text>
          </View>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth, spacings.mtLg]}>
            <Text fontSize={16} weight="semiBold" appearance="secondaryText">
              {t('Experience the benefits of the Gas Tank:')}
            </Text>
          </View>
          <View style={[flexbox.justifyStart, flexbox.alignCenter, { height: 276 }]}>
            {bulletsContent.map(
              (bullet, index) =>
                index < visibleCount && (
                  <Animated.View
                    key={bullet.key}
                    style={{
                      transform: [
                        { translateX: animations[index]?.translateX || 0 },
                        { scale: animations[index]?.scale || 1 }
                      ],
                      opacity: animations[index]?.opacity || 0
                    }}
                  >
                    <LinearGradient
                      colors={[
                        theme.tertiaryBackground as string,
                        theme.primaryBackground as string
                      ]}
                      style={styles.bulletWrapper}
                      start={{ x: 0.15, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <View style={styles.iconWrapper}>{bullet.icon}</View>
                      <Text
                        appearance="secondaryText"
                        weight="medium"
                        style={[spacings.mlSm, { lineHeight: 24 }]}
                      >
                        {t(bullet.text)}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                )
            )}
          </View>
          <View style={[flexbox.directionRow, flexbox.center, common.fullWidth, spacings.pvMd]}>
            <Text fontSize={16} weight="semiBold" appearance="secondaryText">
              {t('To use the Gas Tank, you need a Smart Account')}
            </Text>
          </View>
        </View>
      )}
      <View style={styles.buttonWrapper}>
        <BackButton onPress={handleClose} />
        <Button
          testID={
            isSA ? 'top-up-gas-tank-modal-button' : 'create-smart-account-gas-tank-modal-button'
          }
          type="primary"
          text={isSA ? t('Top Up Gas Tank') : t('Ok, create a Smart Account')}
          size="large"
          hasBottomSpacing={false}
          textStyle={{ ...spacings.prSm }}
          onPress={() =>
            isSA
              ? navigate('top-up-gas-tank')
              : navigate('account-select?triggerAddAccountBottomSheet=true')
          }
        >
          {isSA && <TopUpIcon color="white" strokeWidth={1} width={20} height={20} />}
        </Button>
      </View>
    </BottomSheet>
  )
}

export default React.memo(GasTankModal)
