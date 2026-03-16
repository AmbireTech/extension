import { BehaviorSubject, Subject } from 'rxjs'

// Event stream that gets triggered when we want to close all bottom sheets
export const bottomSheetCloseEventStream = new Subject<void>()

// Keeps track of the number of currently open bottom sheets globally
export const openBottomSheetsCount = new BehaviorSubject<number>(0)
