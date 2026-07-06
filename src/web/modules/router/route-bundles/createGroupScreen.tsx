import { ComponentType, lazy } from 'react'

type ScreenModule = Record<string, ComponentType<any>>

// One React.lazy() per group, reused across every route via `pick`. React.lazy() caches its
// resolved module on the component itself, so reusing the same one means the whole group only
// suspends once - not once per screen, like giving each screen its own lazy() would.
//
// `preload` calls the exact same `importBundle` closure the lazy component uses internally. Don't
// call `import(...)` separately elsewhere for the same bundle to preload it - a separate call site
// isn't guaranteed to share a chunk with this one, so it'd fetch the code twice for nothing.
export default function createGroupScreen<T extends ScreenModule>(importBundle: () => Promise<T>) {
  const GroupScreen = lazy(async () => {
    const bundle = await importBundle()

    const Screen = ({
      pick,
      ...rest
    }: {
      pick: (mod: T) => ComponentType<any>
    } & Record<string, unknown>) => {
      const Picked = pick(bundle)
      return <Picked {...rest} />
    }

    return { default: Screen }
  })

  return Object.assign(GroupScreen, { preload: () => importBundle() })
}
