import { useContext, useMemo } from 'react'

import { ThemeContext } from '@common/contexts/themeContext'

const EMPTY_STYLES = {}

/**
 * Styles built once per `createStyles` and theme, instead of once per component instance
 * - which on a list was once per mounted row for the very same objects.
 */
const stylesByCreateStyles = new WeakMap<object, WeakMap<object, unknown>>()

const getSharedStyles = (createStyles: object, theme: object, build: () => unknown) => {
  let byTheme = stylesByCreateStyles.get(createStyles)

  if (!byTheme) {
    byTheme = new WeakMap<object, unknown>()
    stylesByCreateStyles.set(createStyles, byTheme)
  }

  if (!byTheme.has(theme)) byTheme.set(theme, build())

  return byTheme.get(theme)
}

export default function useTheme<CreateStyles>(createStyles?: CreateStyles) {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within an ThemeProvider')
  }

  // Assume that always the return type will match the `CreateStyles` interface.
  // Otherwise - the complexity is too high to TypeScript it.
  // @ts-ignore
  const styles: ReturnType<CreateStyles> = useMemo(
    () =>
      typeof createStyles === 'function'
        ? getSharedStyles(createStyles, context.theme, () =>
            createStyles(context.theme, context.themeType)
          )
        : EMPTY_STYLES,
    [createStyles, context.theme, context.themeType]
  )

  // Memoized because every component calls this hook, most of them without a
  // `createStyles`, and a spread per render of each of them is the whole cost of those.
  return useMemo(
    () => ({
      ...context,
      styles
    }),
    [context, styles]
  )
}
