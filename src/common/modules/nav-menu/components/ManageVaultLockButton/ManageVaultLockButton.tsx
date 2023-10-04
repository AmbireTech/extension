import React from 'react'
import { TouchableOpacity, View } from 'react-native'

import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useBiometrics from '@common/hooks/useBiometrics'
import { ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'

interface Props {
  handleNavigate: (route: ROUTES) => void
}

const ManageVaultLockButton: React.FC<Props> = ({ handleNavigate }) => {
  const { t } = useTranslation()
  const { isLoading: isLoadingBiometrics } = useBiometrics()

  if (isLoadingBiometrics)
    return (
      <View style={spacings.mv}>
        <Spinner />
      </View>
    )

  return (
    <TouchableOpacity onPress={() => handleNavigate(ROUTES.manageVaultLock)} style={spacings.mbSm}>
      <Text color={colors.titan_50}>{t('Manage Key Store lock')}</Text>
    </TouchableOpacity>
  )
}

export default React.memo(ManageVaultLockButton)
