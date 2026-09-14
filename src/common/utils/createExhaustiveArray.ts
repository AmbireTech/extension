export function createExhaustiveArray<T>() {
  return <A extends readonly (keyof T)[]>(
    array: A &
      ([keyof T] extends [A[number]] ? ([A[number]] extends [keyof T] ? unknown : never) : never)
  ) => array
}
