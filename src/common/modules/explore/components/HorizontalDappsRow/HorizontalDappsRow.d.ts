import { FC } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'

export type HorizontalDappsRowProps = {
  data: Dapp[]
}

declare const HorizontalDappsRow: FC<HorizontalDappsRowProps>

export default HorizontalDappsRow
