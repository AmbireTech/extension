import React, { FC, memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, Pressable } from 'react-native'

import useBenzinNetworksContext from '@benzin/hooks/useBenzinNetworksContext'
import OpenIcon from '@common/assets/svg/OpenIcon'
import { Erc7730StructuredAddressActionsProps } from '@common/components/HumanizedVisualization/Erc7730/interfaces'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import { isExtension } from '@web/constants/browserapi'

function stopPressPropagation(e?: { stopPropagation?: () => void }) {
  e?.stopPropagation?.()
}

const Erc7730StructuredAddressActions: FC<Erc7730StructuredAddressActionsProps> = ({
  address,
  chainId
}) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const { benzinNetworks } = useBenzinNetworksContext()
  const {
    state: { networks }
  } = useController('NetworksController')

  const actualNetworks = networks ?? benzinNetworks
  const network = useMemo(
    () => actualNetworks?.find((n) => n.chainId === chainId),
    [actualNetworks, chainId]
  )

  const handleOpenExplorer = useCallback(async () => {
    if (!network?.explorerUrl) return

    try {
      const targetUrl = `${network.explorerUrl}/address/${address}`

      if (!isExtension) {
        await Linking.openURL(targetUrl)
        return
      }

      await openInTab({ url: targetUrl })
    } catch {
      addToast(t('Failed to open explorer'), {
        type: 'error'
      })
    }
  }, [addToast, address, network?.explorerUrl, t])

  return (
    <>
      {!!network?.explorerUrl && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('View in Explorer')}
          onPress={(e) => {
            stopPressPropagation(e)
            void handleOpenExplorer()
          }}
          style={[spacings.mlTy, flexbox.center]}
        >
          {({ hovered }: any) => (
            <OpenIcon
              color={hovered ? theme.primaryText : theme.secondaryText}
              width={16}
              height={16}
            />
          )}
        </Pressable>
      )}
    </>
  )
}

export default memo(Erc7730StructuredAddressActions)
