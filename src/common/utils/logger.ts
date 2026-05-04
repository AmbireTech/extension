import logger from 'loglevel'

import { isAmbireNext, isProd } from '@common/config/env'

/**
 * Possible log level descriptors, may be string, lower or upper case, or number.
 * There are 6 levels: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'.
 * This disables all logging below the given level, so that after a
 * log.setLevel("warn") call log.warn("something") or log.error("something")
 * will output messages, but log.info("something") will not.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export enum LOG_LEVELS {
  PROD = 'warn',
  DEV = 'trace'
}

export const DEFAULT_LOG_LEVEL = isProd ? LOG_LEVELS.PROD : LOG_LEVELS.DEV
logger.setDefaultLevel(DEFAULT_LOG_LEVEL)

export const setLoggerInstanceLogLevel = (level: LOG_LEVELS) => logger.setLevel(level)

export const logInfoWithPrefix = (event: string, ...args: any) => {
  logger.info(
    `%c[Ambire${isAmbireNext ? ' Next' : ''} ${event}]`,
    `font-weight: bold; background-color: ${'#A36AF8'}; color: white; padding: 2px 4px; border-radius: 4px;`,
    ...args
  )
}

export const logWarnWithPrefix = (event: any, ...args: any) => {
  logger.warn(
    `%c[Ambire${isAmbireNext ? ' Next' : ''} ${event}]`,
    `font-weight: bold; background-color: ${'#FFD970'}; color: white; padding: 2px 4px; border-radius: 4px;`,
    ...args
  )
}

export default logger
