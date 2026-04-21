import { Context, FC, ReactNode } from 'react'

import { BiometricsContextReturnType } from '@common/contexts/biometricsContext/types'

declare const BiometricsContext: Context<BiometricsContextReturnType>
declare const BiometricsProvider: FC<{ children: ReactNode }>

export { BiometricsContext, BiometricsProvider }
