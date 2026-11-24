import { createContext } from 'react'

export type SheetHeaderTitleContextValue = {
  /** Where the title's text sits: `left` once a long title made room by dropping the centering. */
  align: 'left' | 'center'
  /**
   * The title ignores its `numberOfLines` while true, so a long title capped at one line still
   * wraps and moves left, where the cap applies again. Off where the title can't move left.
   */
  isLineCapIgnored: boolean
  /**
   * Tells the row how many lines a text of the title takes and how tall the first one is, so
   * a wrapping title can move left and the buttons line up with its first line.
   */
  reportLines: (lineCount: number, firstLineHeight: number) => void
}

/**
 * Set around the title of a native sheet's header row, so a long title wraps instead of being
 * cut (and sits left when there is no back button). Read by `Text`.
 */
export const SheetHeaderTitleContext = createContext<SheetHeaderTitleContextValue | null>(null)
