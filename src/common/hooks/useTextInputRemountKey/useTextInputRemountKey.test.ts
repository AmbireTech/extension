/**
 * @jest-environment jsdom
 */
import { act, createElement } from 'react'
import { createRoot, Root } from 'react-dom/client'

import useTextInputRemountKey from './useTextInputRemountKey'

jest.mock('@common/config/env', () => ({ isWeb: false }))

const Consumer = ({ value, isFocused }: { value: string; isFocused: boolean }) =>
  createElement('span', null, useTextInputRemountKey(value, isFocused))

const mount = () => {
  // React 18+ refuses to flush effects inside act() without this flag
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  const container = document.createElement('div')
  const root = createRoot(container)
  const render = (value: string, isFocused: boolean) =>
    act(() => {
      root.render(createElement(Consumer, { value, isFocused }))
    })

  return { root, render, getKey: () => Number(container.textContent) }
}

const changeValue = (
  render: (value: string, isFocused: boolean) => void,
  times: number,
  isFocused: boolean
) => {
  for (let i = 1; i <= times; i += 1) render(`${i}`, isFocused)
}

describe('useTextInputRemountKey', () => {
  let root: Root

  afterEach(() => {
    act(() => root.unmount())
  })

  it('remounts an unfocused input after 50 value changes, not before', () => {
    const mounted = mount()
    root = mounted.root
    mounted.render('0', false)

    changeValue(mounted.render, 49, false)
    expect(mounted.getKey()).toBe(0)
    mounted.render('50', false)
    expect(mounted.getKey()).toBe(1)
  })

  it('does not count re-renders that keep the same value', () => {
    const mounted = mount()
    root = mounted.root
    for (let i = 0; i < 100; i += 1) mounted.render('same', false)

    expect(mounted.getKey()).toBe(0)
  })

  it('never remounts a focused input, and remounts it once it is blurred', () => {
    const mounted = mount()
    root = mounted.root
    mounted.render('0', true)

    changeValue(mounted.render, 80, true)
    expect(mounted.getKey()).toBe(0)
    mounted.render('80', false)
    expect(mounted.getKey()).toBe(1)
  })
})
