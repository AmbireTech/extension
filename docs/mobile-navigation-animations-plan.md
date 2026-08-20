# Mobile navigation animations — research & execution plan

**Goal:** native-feeling screen transitions (push/pop + interactive swipe-back) on the mobile app,
without dropping `react-router-native` and without forking the routing structure shared with the extension.

**Status:** plan only. No code written yet.

---

## 1. Where we are today

| Fact | Evidence |
|---|---|
| Router is `NativeRouter` = react-router `MemoryRouter` | `src/common/modules/app-init/screens/AppInit/AppInit.native.tsx:29`, `node_modules/react-router-native/dist/index.js` (`NativeRouter` just renders `MemoryRouter`) |
| Two sibling `<Routes>` trees render at once | `src/mobile/modules/router/Router.tsx` (dashboard + unlock) and `src/mobile/modules/router/components/MainRoutes/MainRoutes.tsx` (everything else), both with a `path="*" element={null}` fallback |
| Only one location is ever rendered; the outgoing screen unmounts instantly | react-router default behaviour — this is the whole reason there is no animation |
| Swipe-back today is a fake: a single app-wide `Gesture.Pan()` with `.runOnJS(true)` that only fires `goBack()` on release | `src/common/modules/app-init/screens/AppInit/GestureHandler.native.tsx:60-99` |
| Android hardware back is handled in the same file, also unanimated | same file, lines 36-58 |
| `canGoBack` is derived from a `prevRoute` object stuffed into `location.state` on every navigate (nests recursively → state grows on every hop) | `src/common/hooks/useNavigation/useNavigation.tsx:29-38,62-70` |
| Onboarding has its own graph-based navigator; "back" there is a **forward push**, not a history pop | `src/common/modules/auth/contexts/onboardingNavigationContext/onboardingNavigationContext.tsx` — `goToPrevRoute()` calls `navigate(prevRoute.name, ...)` |
| Route guards redirect **during render** via `<Navigate>` | `AuthenticatedRoute.tsx:19-22`, `KeystoreUnlockedRoute.tsx:11-13` |
| Dashboard already fakes a transition by rendering skeletons for one frame | `src/mobile/modules/dashboard/screens/DashboardScreen.tsx:43-51` ("Defer rendering of heavy components to prevent blocking route transition") |
| `react-native-reanimated@4.1.1` + `react-native-worklets@0.5.1` + `react-native-gesture-handler@2.28.0` are installed; **`react-native-screens` is not** | `package.json` |
| New Architecture is on; Android `minSdk 24`, `enableOnBackInvokedCallback="false"` (no predictive back) | `android/gradle.properties:38`, `android/app/build.gradle:95-98`, `android/app/src/main/AndroidManifest.xml:37` |

### Two enabling facts that make this tractable

1. **`<Routes location={...}>` scopes `LocationContext` for its subtree.**
   `useRoutes` wraps the rendered matches in a new `LocationContext.Provider` when a `location`
   argument is passed (`node_modules/react-router/dist/react-router.development.js:365-370`).
   → a screen rendered for an *old* location keeps seeing its own `useLocation()`/`useRoute()`/params
   while the app has already moved on. This is what lets an outgoing screen stay mounted and correct
   during the animation.

2. **The memory history object is reachable and exposes `index`.**
   `MemoryRouter` passes the history instance as `navigator` (`react-router.development.js:1014-1021`),
   and `createMemoryHistory` exposes `get index()` (`@remix-run/router/dist/router.cjs.js:124-133`).
   → `useContext(UNSAFE_NavigationContext).navigator` gives us the real stack depth and lets us tell
   push from pop reliably, plus a correct `canGoBack` (`index > 0`) that replaces the `prevRoute` hack.

---

## 2. What "native" actually means (conventions + exact numbers)

Researched from Apple/Material conventions and from the reference implementation everyone
compares against — react-navigation's JS `stack` (the numbers below are quoted from its source).

### iOS — `UINavigationController` push/pop
- Incoming card slides full-width from the right; the screen underneath **parallaxes left by 30%**.
- A dim overlay darkens the underlying screen (max **0.07** opacity) and the incoming card casts a
  shadow on its leading edge (opacity ramps **0 → 0.3**).
- Interactive pop from the **left screen edge** (`UIScreenEdgePanGestureRecognizer`); cancellable —
  releasing below threshold springs the card back with no navigation.
- Motion spec (`TransitionIOSSpec`): spring, `stiffness: 1000, damping: 500, mass: 3,
  overshootClamping: true, restDisplacementThreshold: 10, restSpeedThreshold: 10`, both directions.
- Gesture activation area (`gestureResponseDistance`): **50 px** from the left edge.
- Commit rule: `translation + velocity * 0.3 > width / 2` → pop, else spring back.
  (`GESTURE_VELOCITY_IMPACT = 0.3`; release velocity is fed into the closing spring.)
- Card interpolation (`forHorizontalIOS`):
  `translateX: [0,1] → [width, 0]`; next card `translateX: [0,1] → [0, -width*0.3]`;
  `overlayOpacity: [0,1] → [0, 0.07]`; `shadowOpacity: [0,1] → [0, 0.3]`.

### Android — Material / platform default
react-navigation picks by API level; the two that matter for us:
- **API ≥ 34 (Android 14+) — `FadeFromRightAndroid`:** card `translateX: [0,1] → [96, 0]`,
  next card `[0,1] → [0, -96]`, cross-fade opacity.
  Open: timing **350 ms `Easing.out(Easing.poly(5))`**; close: timing **150 ms linear**.
- **API 29–33 — `ScaleFromCenterAndroid`:** timing **400 ms `Easing.bezier(0.20833, 0.82, 0.25, 1)`**,
  scale `[0,1,2] → [0.85, 1, 1.075]` (closing `[0,1] → [0.925, 1]`), opacity keyframes
  `[0, 0.75, 0.875, 1, 1.0825, 1.2075, 2] → [0, 0, 1, 1, 1, 1, 0]`.
- **Swipe-back is OFF on Android by default** (`gestureEnabled`: iOS `true`, Android `false`).
  Android's convention is the system back gesture/button — which reaches us as `hardwareBackPress`.
  Predictive back (Android 15+) needs `enableOnBackInvokedCallback` + native screens; **out of scope**,
  see §7.

**Proposal:** ship two Android presets — `FadeFromRight` for API ≥ 34, `ScaleFromCenter` for
everything below (including API 24–28, where it is visually fine). Implementing all four of
react-navigation's ladder buys nothing.

---

## 3. Prior art (and what we take from each)

| Project | What it does | Take-away |
|---|---|---|
| [`Traviskn/react-router-native-stack`](https://github.com/Traviskn/react-router-native-stack) | Card stack for react-router-native v4. Listens for `PUSH`/`POP` on history to choose direction; tracks the mount-time history index to know when swipe-back must stop; `PanResponder` for the swipe. | Confirms the *shape* of the solution (history action → direction). But it **unmounts the previous screen on push** and uses `PanResponder` — both are exactly what we must not do. |
| [`lucarge/react-router-reanimated`](https://github.com/lucarge/react-router-reanimated) | `AnimatedSwitch` drop-in, built on `react-native-screens`, stacks screens using the history API, gesture navigation included. | Validates the "stack real screens, drive from history" model. **Only supports react-router < 6** (v6 removed direct history access) — we get around that via `UNSAFE_NavigationContext.navigator` (§1.2). |
| `react-router-native-animate-stack` | Swipeable stack, forward + backward. | Same family; no interactive/cancellable gesture fidelity. |
| framer-motion + `<Routes location={displayLocation}>` pattern ([RR discussion #8604](https://github.com/remix-run/react-router/discussions/8604), [dev.to writeup](https://dev.to/fazliddin04/react-router-v6-animated-transitions-diy-3e6l)) | Keep a `displayLocation` in state, render `<Routes location={displayLocation}>`, swap it after the exit animation. | This is the core trick we use — generalised from *one* held-back location to an *N-entry stack*. |
| [`motion` issue #1946](https://github.com/motiondivision/motion/issues/1946) | Components kept mounted by `AnimatePresence` re-render with the *new* router context before unmounting. | Known trap. Avoided because `<Routes location>` re-provides `LocationContext` per card (§1.1). |
| [Callstack: custom screen transitions](https://www.callstack.com/blog/custom-screen-transitions-in-react-navigation) | Interpolator/gesture composition patterns in react-navigation. | Reference for the interpolator API shape. |

**Conclusion: no existing package fits.** Every react-router-native stack library is v4/v5-era,
PanResponder-based, or unmaintained. We build a small in-repo stack (~400 lines) using the primitives
we already ship (reanimated 4 + gesture-handler 2.28) and the numbers from §2.

---

## 4. Options considered

### Option A — in-repo Reanimated card stack (**recommended**)
Render N stack entries, each `<Routes location={entry.location}>`, inside animated cards.
Reanimated drives the transforms on the UI thread; gesture-handler drives the interactive pop.

- ✅ No new native dependency, no `expo prebuild`/pod churn, no LavaMoat/policy impact.
- ✅ Total control; matches iOS/Android conventions exactly (same math as react-navigation).
- ✅ Incremental: can be shipped behind a flag and fall back to today's behaviour.
- ❌ The incoming screen's first render happens on the JS thread → a heavy screen can drop the first
  frames of the animation (same limitation react-navigation's JS stack has). Mitigations in §5.7.
- ❌ No Android predictive back.

### Option B — add `react-native-screens` and drive `ScreenStack` from the router
True `UINavigationController`/Fragment transitions, native interactive pop, predictive-back-ready.

- ✅ Highest fidelity, native memory/perf behaviour (`react-freeze` + native screen detaching).
- ❌ New native dependency in a bare-workflow app (prebuild + pods + regression risk across
  `@gorhom/portal`, `react-native-keyboard-controller`, safe-area, bottom sheets).
- ❌ The native stack becomes a second source of truth: native pop happens first, the router must be
  reconciled after (`onDismissed`). Divergence bugs here are nasty and hard to reproduce.
- ❌ Bigger blast radius right before a production release.

**Recommendation: Option A now.** It reaches "feels native" for both platforms with the deps we
already have. Option B stays open as a later swap — §5 deliberately isolates the stack behind a
component boundary so the renderer can be replaced without touching screens.

---

## 5. Design (Option A)

New module: `src/mobile/modules/router/stack/` (mobile-only; the extension keeps rendering
`<Routes>` directly).

```
stack/
  NavigationStack.tsx        # owns the entry list, renders the cards
  useStackEntries.ts         # history -> entries reducer (direction resolution)
  ScreenCard.tsx             # one animated card + its pan gesture
  presets.ts                 # specs + interpolators (iOS / Android 14+ / Android <14)
  screenFocusContext.tsx     # per-card isFocused
```

### 5.1 Source of truth
```ts
const { navigator } = useContext(UNSAFE_NavigationContext)
const history = navigator as unknown as { index: number; action: Action; location: Location }
```
`history.index` + `useNavigationType()` + `useLocation()` are read on every location change.
An entry is `{ key: location.key, location, index }`.

### 5.2 Direction resolution (the part that needs care in *this* codebase)
| Trigger | Detection | Animation |
|---|---|---|
| Normal `navigate(path)` | `PUSH`, `index` increased | push (forward) |
| `goBack()` / `navigate(-1)` | `POP`, `index` decreased | pop (backward), drop entries above `index` |
| `navigate(path, { replace: true })` | `REPLACE` | swap top entry, animated in the direction the destination declares (see §9) |
| Boot `<Navigate to={startRoute} replace />` (`Router.tsx:123`) | the route is the first card there ever was | no animation |
| Guard redirect (`AuthenticatedRoute`, `KeystoreUnlockedRoute`) | target is a **root route** (`dashboard`, `unlock`, `get-started`) | collapse the stack to one entry, animated in the destination's direction (§9) |
| Onboarding `goToPrevRoute()` — a forward push that means "back" | opt in explicitly: add `state: { navDirection: 'back' }` in `onboardingNavigationContext.goToPrevRoute` (one call site, `onboardingNavigationContext.tsx:296`) | pop animation, and the entry it returns to is reused instead of duplicated |
| Gesture-driven pop | stack already animated it; mark `pendingGesturePopKey` before calling `navigate(-1)` so the resulting `POP` is applied without re-animating | none (already at final position) |

`canGoBack` on mobile becomes `history.index > 0` (`useNavigation.tsx`). The recursive
`state.prevRoute` nesting can then be dropped — **but** `DappWebViewFooter.tsx:64` reads
`route.state.prevRoute.pathname`; migrate it to the stack (`useNavigationStack()` → entry below top)
in the same change, or leave `prevRoute` in place for now. (`HeaderBackButton.tsx:33` also reads it,
but that component is extension-only — verify before touching.)

### 5.3 Rendering
Extract the two `<Routes>` blocks (`Router.tsx` + `MainRoutes.tsx`) into a single
`<AppRoutes location={...} />` that forwards the `location` prop to both. Then:

```tsx
<NavigationStack>
  {entries.map((entry, i) => (
    <ScreenCard key={entry.key} index={i} isTop={i === entries.length - 1} ...>
      <AppRoutes location={entry.location} />
    </ScreenCard>
  ))}
</NavigationStack>
```
`RequestsBottomSheet`, `GlobalTooltip`, `PortalHost`, `NfcCardSessionModal` stay **outside** the
stack (they must float above every card) — they already do.

Each card is `position: absolute` + `StyleSheet.absoluteFill` with an **opaque background**
(`theme.primaryBackground`) so lower cards never bleed through.

### 5.4 Animation
Each entry owns `progress: SharedValue<number>` (0 = off-screen right, 1 = settled). A card reads
its own `progress` and the `progress` of the card **above** it (`nextProgress`) for the parallax /
overlay. Shared values live in a ref-held `Map<key, SharedValue>` inside `NavigationStack`.

- push: mount at `0`, animate → `1` with the open spec; the card below animates its parallax from
  the same shared value (free — one animation drives both).
- pop: animate top → `0`, then `runOnJS` remove the entry from React state.
- Specs and interpolators exactly as §2, in `presets.ts`, selected by
  `isiOS` / `Platform.Version >= 34` (use `@common/config/env` helpers for the platform check).

### 5.5 Interactive swipe-back (iOS)
Replaces the app-wide pan in `GestureHandler.native.tsx` with a per-card gesture that only the top
card owns, running **on the UI thread** (no `.runOnJS(true)`):

```ts
Gesture.Pan()
  .enabled(isTop && canGoBack && !gestureDisabled)
  .activeOffsetX(10)
  .failOffsetY([-5, 5])                  // vertical scrolls win
  .hitSlop({ left: 0, width: 50 })       // gestureResponseDistance = 50 (§2)
  .onUpdate(e => { progress.value = clamp(1 - e.translationX / width, 0, 1) })
  .onEnd(e => {
    const shouldPop = e.translationX + e.velocityX * 0.3 > width / 2
    progress.value = withSpring(shouldPop ? 0 : 1, { ...IOS_SPEC, velocity: -e.velocityX },
      finished => { if (finished && shouldPop) runOnJS(commitPop)() })
  })
```
Preserved from the current handler: bottom sheets close first
(`openBottomSheetsCount` / `bottomSheetCloseEventStream`), and the dapp WebView consumes back first
(`goBackInWebViewHistory()`). Both checks move into `commitPop`/gesture `enabled`.

Android: gesture off; `hardwareBackPress` calls the same `commitPop`, which now runs the pop
animation instead of jumping.

### 5.6 Mount policy — **the main behavioural decision**
Today every screen unmounts the instant you navigate away. A stack keeps lower entries mounted.

- **A1 (recommended, real stack):** entries stay mounted while they are in the stack.
  Back is instant and correct — no dashboard skeleton flash (`DashboardScreen.tsx:43-51` exists
  precisely because of that flash today).
  Requires: a focus API + an audit of screens that assume mount == "screen shown".
- **A2 (fallback):** lower entries mount only for the duration of a transition.
  Zero behavioural change, but the pop destination mounts *during* the animation → the heavy screens
  (dashboard) will visibly pop in. Acceptable as an intermediate milestone, not as the end state.

Audit list for A1 (small — verified by grep):
- `QrReaderScreen` / `CameraScanner` (`expo-camera`) — **must** stop the camera on blur.
- `DappWebViewScreen` — 9 `useEffect`s, holds a WebView; must pause/mute on blur.
- `SwapAndBridgeScreen` — dispatches `resetForm` / `unloadScreen` on unmount
  (`SwapAndBridgeScreen.tsx:132,145`); move to blur or keep unmount semantics for that route.
- `AccountsSettingsScreen`, `KeyStoreSetupScreen`, `QrConnectScreen`, `AccountSelectScreen`,
  `KeyStoreUnlockScreen` — re-check their mount effects.
- The `AccountPickerController` reset effect in `onboardingNavigationContext.tsx:333-356` is
  path-driven, not mount-driven → unaffected.

API: `useIsScreenFocused()` in `@common/hooks` (`.native` reads the card context, `.web` returns
`true`), so shared screens keep compiling for the extension.

### 5.7 Guards, freezing and perf
- **Guard hazard:** `AuthenticatedRoute` / `KeystoreUnlockedRoute` render `<Navigate>` during render.
  With N mounted cards, locking the keystore would fire N navigations. Fix: they navigate only when
  focused — `if (shouldNavigate) return isFocused ? <Navigate .../> : null`. Web behaviour is
  unchanged (`useIsScreenFocused()` returns `true` there).
- **Freezing (optional, milestone 5):** add `react-freeze` (JS-only, no native code — it is
  `react-native-screens`' own freezing primitive) and wrap non-top cards in `<Freeze freeze>`.
  Stops background cards from re-rendering on every controller `emitUpdate`. Measure before adopting.
- **First-frame cost:** mount the incoming card, let React commit, then start the animation on the
  next frame (`requestAnimationFrame`), so the mount cost does not eat the animation's opening frames.
  Keep `DashboardScreen`'s existing skeleton deferral.
- Set `renderToHardwareTextureAndroid` (Android) / `shouldRasterizeIOS` (iOS) on cards **only while a
  transition is in flight** — important for `DappWebViewScreen`, where an animated transform over a
  live WebView is the worst case.
- Dismiss the keyboard when a transition starts (`KeyboardController.dismiss()`), matching native.

---

## 6. Milestones

Each milestone is independently shippable and independently verifiable on a device.

**M0 — Groundwork (no visual change)**
1. Extract `<AppRoutes location={...} />` from `Router.tsx` + `MainRoutes.tsx`.
2. Expose the memory history (`useNavigationHistory()`) and switch mobile `canGoBack` to
   `history.index > 0`.
   *Verify:* app behaves exactly as before; `canGoBack` is correct on every screen incl. onboarding.

**M1 — Static stack, no animation**
3. `NavigationStack` + `useStackEntries` reducer; cards rendered absolutely, top card visible.
4. Direction resolution table (§5.2) implemented, incl. the onboarding `navDirection: 'back'` flag
   and the root-route reset rule.
   *Verify:* every route in `MainRoutes` reachable; guard redirects, boot redirect, WalletConnect and
   deep-link navigations all land on a single correct card; no duplicate/orphan entries after a full
   onboarding run (log `entries.map(e => e.location.pathname)`).

**M2 — Push/pop animation**
5. `presets.ts` (iOS spring + parallax + overlay + shadow; Android 14+ fade-from-right; Android <14
   scale-from-center) and the `progress`-driven `ScreenCard`.
   *Verify:* side-by-side against a stock react-navigation sample on the same device; 60 fps in the
   Perf Monitor on a mid-range Android device; no flicker on pop.

**M3 — Interactive swipe-back (iOS) + animated Android back**
6. Per-card pan gesture with the react-navigation commit rule; `GestureHandler.native.tsx` reduced to
   its bottom-sheet / WebView-back concerns.
   *Verify:* cancellable mid-swipe; velocity flick pops; swipe disabled on root routes and when a
   bottom sheet is open; WebView back still consumed first; Android hardware back animates.

**M4 — Focus API + mount policy A1**
7. `useIsScreenFocused()`, guard fix, camera/WebView blur handling, `SwapAndBridge` unload move.
   *Verify:* camera LED off after navigating away from the QR reader; no double navigations when
   locking the keystore from a deep screen; returning to the dashboard shows data instantly (no
   skeleton).

**M5 — Polish (optional)**
8. `react-freeze`, rasterization hints, keyboard dismissal, per-route presentation overrides
   (e.g. `menu` / `receive` as a modal slide-up) driven off `routesConfig`.

---

## 7. Risks / non-goals

- **Behaviour change from keeping screens mounted (M4)** — the biggest risk. Mitigated by the audit
  list in §5.6 and by M4 being a separate, revertable milestone (A2 is the fallback).
- **Onboarding's forward-push "back"** silently doubles stack depth. M1 handles the animation; making
  `goToPrevRoute()` a real `navigate(-1)` when the target is the entry below is a *follow-up*, not
  part of this plan (it touches shared web code).
- **JS-thread stalls** on heavy screen mounts can still cost the first 1-2 frames. Option B is the
  only full fix; §5.7 gets us close.
- **Android predictive back** (Android 15+) is a non-goal — it needs `enableOnBackInvokedCallback` +
  native screens (Option B).
- **The extension/web is untouched.** Everything new lives in `src/mobile/` or behind
  `.native`/`.web` suffixes.
- Unrelated dead code spotted while researching (not touched): `useDisableNavigatingBack`
  (`src/common/hooks/useDisableNavigatingBack/`) has zero call sites and references a
  react-navigation-style `navigation.setOptions({ gestureEnabled })` API that does not exist here.

---

## 8. Open questions for the team

1. **Mount policy:** go straight to A1 (real stack, screens stay mounted) or ship A2 first and
   migrate? A1 is the native behaviour and the only one that removes the dashboard skeleton flash.
2. **Android swipe-back:** follow the platform convention (system back only, as react-navigation
   does) or also enable the edge swipe on Android?
3. **Modal presentation:** should any routes (`menu`, `receive`, `account-select`, `transfer`) slide
   up as modals instead of pushing as cards, or is a uniform card stack the intended design?
4. Is `HeaderBackButton` (`src/common/modules/header/`) ever rendered on mobile? If not, `prevRoute`
   in `location.state` can be dropped entirely on native (it currently nests on every navigation).

---

## Sources

- [react-navigation `TransitionSpecs`](https://github.com/react-navigation/react-navigation/blob/main/packages/stack/src/TransitionConfigs/TransitionSpecs.tsx),
  [`TransitionPresets`](https://github.com/react-navigation/react-navigation/blob/main/packages/stack/src/TransitionConfigs/TransitionPresets.tsx),
  [`CardStyleInterpolators`](https://github.com/react-navigation/react-navigation/blob/main/packages/stack/src/TransitionConfigs/CardStyleInterpolators.tsx),
  [`Card.tsx`](https://github.com/react-navigation/react-navigation/blob/main/packages/stack/src/views/Stack/Card.tsx)
- [react-navigation stack navigator docs](https://reactnavigation.org/docs/stack-navigator/) (gesture defaults)
- [`Traviskn/react-router-native-stack`](https://github.com/Traviskn/react-router-native-stack)
- [`lucarge/react-router-reanimated`](https://github.com/lucarge/react-router-reanimated)
- [react-router discussion: animating out routes](https://github.com/remix-run/react-router/discussions/8604),
  [motion issue #1946](https://github.com/motiondivision/motion/issues/1946)
- [React Router v6 animated transitions DIY](https://dev.to/fazliddin04/react-router-v6-animated-transitions-diy-3e6l)
- [Callstack: Custom screen transitions in React Navigation](https://www.callstack.com/blog/custom-screen-transitions-in-react-navigation)

---

## 9. Animation direction — the rules the stack follows

`react-native-screens` picks the transition from the diff between the old and the new
list of cards, and there are only three outcomes:

| What changed | What the platform plays | Where it takes the animation from |
|---|---|---|
| A card was added on top | push | the incoming card |
| The top card was removed, revealing one that is still there | pop | the outgoing card |
| The top card was swapped for one that was not in the stack (**replace**) | whatever the incoming card's `replaceAnimation` says | incoming card if `push`, outgoing card if `pop` |

The first two need no configuration. Every transition the app performs *on its own* —
boot redirects, guard redirects, unlocking — is the third one, because those collapse
the stack to a single card. `replaceAnimation` defaults to **`pop`** in
`react-native-screens`, which is why they all used to look like a back navigation.
react-navigation's native stack overrides the same default (`animationTypeForReplace`,
default `push`); this app now does too, with these rules:

1. **`/` is a redirect hub, not a screen.** No route matches it; `Router` resolves where
   to go and navigates on. So it never gets a card: on boot the first *real* route is the
   first card, which the platform puts up without animating (splash → unlock is silent),
   and later (`useKeyStoreUnlock` sends the user through `/` after unlocking) the card on
   top keeps its screen and only follows the history position — so unlock → `/` →
   dashboard is **one** forward transition instead of two backward ones.
2. **Forward is the default.** A screen taking the place of another is a step forward
   unless something says otherwise, which is what makes automatic navigations
   (unlock → dashboard, the end of onboarding → dashboard) read correctly.
3. **Leaving the wallet is backwards** — `MOBILE_BACKWARDS_ROUTE_PATHS` (`unlock`,
   `get-started`). These are the destinations of the two route guards: the keystore
   locking, or the last account going away. They have no call site to annotate, and they
   always mean the user was taken *out* of the app, so the destination itself declares
   the direction.
4. **Navigating to a screen that is already in the stack goes back to it** — it is
   revealed with its state, the screens above it are dropped, and the platform sees a
   real pop. Same semantic as react-navigation's `navigate` (`push` is the one that
   stacks a duplicate). This is what covers the buttons that send the user home by
   navigating rather than popping, the in-app browser leaving for the apps catalog, and
   a flow returning to an earlier step — with nothing to declare at the call site. A flow
   that means to go *deeper* into a screen it has already been on is the `push` case and
   declares `state: FORWARD_NAVIGATION_STATE` — the account personalize screen opening the
   account picker it may itself have arrived from (hardware wallets), so completing that
   picker reveals the same personalize screen instead of building a second one. Note
   the key is the **live card stack**, not a list of routes visited earlier: the stack
   is exactly "what is behind you right now", while a visited list cannot tell going
   forward to a screen you once saw from going back to one still behind you, and could
   not be invalidated on a lock or a sign-out.
5. **A back step to a screen with no card says so at the call site**, with
   `state: BACK_NAVIGATION_STATE` — the onboarding flow can skip steps, so the step it
   returns to is not always in the stack. The remaining cases where a destination has no
   card are genuinely ambiguous (the dashboard is entered forward from unlock and
   backwards from a screen above it), which is why direction is a property of the
   navigation there, not of the destination.
6. **A pop that has to resync** (the history points at an entry the stack no longer has)
   is animated backwards, since it is still a back navigation even though the card it
   lands on has to be rebuilt.

**One stable location per card.** `<Routes location={...}>` cannot be used to render a
card: react-router spreads the location into the context it provides, so the object is
rebuilt on every render, and everything derived from it - `navigate` first of all -
changes identity every render, re-running every effect that depends on it. With a screen
kept mounted across a redirect (rule 1) that turns a one-shot redirect effect
(`useKeyStoreUnlock`) into an unbounded navigation loop - "Maximum update depth
exceeded". `AppRoutes` therefore provides the scoped `LocationContext` itself, memoized on
the card's location.

Rules 1–6 live in `stackEntries.ts` (`resolveReplaceAnimation`, `REDIRECT_HUB_PATH`) and
are covered by the reducer's unit tests. Only the transitions that build a *new* card on
top of an old one need a direction at all — a revealed card (rule 4) and a real pop are
animated by the platform from the cards themselves.

# Implementation status

Option A, milestones **M0–M4 are implemented**. Everything below type-checks
(`yarn extension:type:check-new` → *0 new errors*), lints clean, and the stack
reducer is covered by 9 unit tests (`src/mobile/modules/router/stack/stackEntries.test.ts`).
**Nothing has been run on a device yet** — see "Device verification" below.

## What was built

| File | Role |
|---|---|
| `src/common/hooks/useMemoryHistory/` | Reaches the memory history instance (`index`, `action`) through `UNSAFE_NavigationContext` |
| `src/mobile/modules/router/components/AppRoutes/` | Every mobile route, rendered for one explicit `location` (memoized) |
| `src/mobile/modules/router/stack/stackEntries.ts` | Pure reducer: history event → card stack. All direction rules live here |
| `src/mobile/modules/router/stack/stackEntries.test.ts` | 9 tests over the direction rules |
| `src/mobile/modules/router/stack/useStackEntries.ts` | Applies the reducer while rendering, so a card is never a frame behind the router |
| `src/mobile/modules/router/stack/presets.ts` | The platform transition specs and interpolators, values taken from react-navigation's source |
| `src/mobile/modules/router/stack/ScreenCard.tsx` | One card: transform, iOS overlay + edge shadow, focus provider |
| `src/mobile/modules/router/stack/NavigationStack.tsx` | Owns the animated offsets, runs the transitions, hosts the swipe back gesture |
| `src/common/contexts/screenFocusContext/` | `useIsScreenFocused()`; `true` everywhere except below the top mobile card |
| `src/common/hooks/useBackAction/` | The single definition of "back": sheet → browser history → pop |

Modified: `Router.tsx` (renders the stack), `MainRoutes.tsx` (+`location` prop),
`useNavigation.tsx` (`canGoBack` from the history index), `GestureHandler.native.tsx`
(app-wide pan removed, back button routed through `useBackAction`),
`AuthenticatedRoute` / `KeystoreUnlockedRoute` (focus-gated redirects),
`CameraScanner.tsx` (`active={isFocused}`), `onboardingNavigationContext.tsx`
(marks its backwards pushes), `router/constants/common.ts` (`MOBILE_ROOT_ROUTE_PATHS`).

## Deviations from the plan above, and why

1. **Offsets are in pixels, not a 0..1 progress.** react-navigation animates the
   gesture value in pixels and derives progress from it, which is why its spring
   thresholds (10) and the commit rule (`translation + velocity * 0.3 > width / 2`)
   are expressed in pixels. Keeping the same unit means the gesture velocity feeds
   the spring directly, with no conversion.
2. **Reanimated 4 removed `restDisplacementThreshold` / `restSpeedThreshold`**
   (replaced by a single relative `energyThreshold`). The spring physics are
   unchanged; `energyThreshold: 6e-4` approximates the platform's 10 px rest
   threshold and only cuts the imperceptible tail. **Confirm on device.**
3. **New rule — a push to a root path that is already in the stack animates as a
   back transition.** Four screens (`SwapAndBridgeScreen`, `AccountSelectScreen`,
   `NetworksScreen`, `SignAccountOpScreen`) send the user home with
   `navigate(ROUTES.dashboard)` instead of popping. Without this rule the most
   common "back" in the app would have been the one transition with no animation.
4. **The gesture lives in the stack, not in each card.** The stack owns the shared
   values, and the repo's lint rules (rightly) forbid a component from mutating a
   shared value it received as a prop. One gesture also beats one per card.
5. **`useBackAction` fixes a latent bug.** The old root-path guard compared a
   pathname (`/dashboard`) against route names (`dashboard`), so it only ever
   matched `/`. It now matches as intended, which means back at the dashboard,
   unlock and get-started screens is a no-op instead of popping to a stale entry.
6. **The keyboard is dismissed when a transition starts.** New requirement created
   by keeping screens mounted: the outgoing screen's focused input would otherwise
   hold the keyboard up over the incoming screen.
7. **Where a swipe must not drag the card** — a bottom sheet is open, or the in-app
   browser has page history — the gesture still triggers back (closing the sheet /
   walking the page history) but the card stays put, since there may be nothing
   behind it to reveal.
8. `settledKey` on the reducer state marks a card that enters already in place (the
   one a back transition reveals), so a push landing while another card is still
   animating out cannot be mistaken for it.

## Device verification (not done — needs a build)

1. Push/pop on iOS: parallax, dim overlay, edge shadow, and the spring's settle time
   against a stock react-navigation screen.
2. Swipe back: cancellable mid-swipe, velocity flick commits, disabled on root
   routes; check the left 50 px strip does not steal from horizontal carousels.
3. Android 14+ vs Android 10–13 devices: the two presets, and that the system back
   gesture now animates.
4. Full onboarding run, then a lock from a deep screen: no duplicate cards, no
   double navigation, stack collapses.
5. QR reader: camera stops when a screen is pushed over it.
6. 60 fps in the perf monitor on a mid-range Android device, dashboard → token
   details → back.

## Known follow-ups (deliberately not done)

- `NetworksScreen` and `AccountSelectScreen` navigate from inside an effect. Both are
  gated by state set by a user action, so the window is narrow, but a mounted-but-
  unfocused card could now navigate from behind. Gate on `useIsScreenFocused()` if
  it shows up in testing.
- `react-freeze` for cards below the top (M5) — measure first.
- Per-route modal presentation (`menu`, `receive`) — M5.
- Android predictive back — needs `react-native-screens` (Option B).
- `useDisableNavigatingBack` is dead code that references a react-navigation API this
  app does not have. Untouched.
- `location.state.prevRoute` still nests on every navigation. It can now be replaced
  by the stack, but `HeaderBackButton` (rendered on mobile through `Header`) and
  `DappWebViewFooter` still read it. Open question 4 above is answered: **yes**, it is
  used on mobile.
