// Deliberately does NOT re-export `bootReport`: that module pulls in react-native
// and expo-file-system, and the instrumented call sites are on the boot path this
// profiler is supposed to measure. The report is imported lazily, at the moment it
// is printed (see useBootProfileReport).
export {
  bootProfiler,
  getAllBootMarks,
  markBoot,
  markBootOnce,
  markSplashHidden,
  markStorageSnapshotKeys,
  monotonicNow,
  setWorkerBootProfile
} from './bootProfiler'
export {
  BOOT_MARK,
  BOOT_MARK_PREFIX,
  BOOT_PROFILE_DEADLINE,
  BOOT_PROFILE_MARKS_EVENT,
  BOOT_PROFILE_MARKS_MESSAGE,
  BOOT_PROFILE_REALM,
  BOOT_PROFILE_WORKER_FLUSH_TIMEOUT,
  IS_BOOT_PROFILING_ENABLED
} from './constants'
export type { BootMark, BootMarkDetail, BootProfilePayload } from './types'
