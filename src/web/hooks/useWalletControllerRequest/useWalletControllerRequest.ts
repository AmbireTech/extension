import { useEffect, useRef, useState } from 'react'

/**
 * Simplifies handling asynchronous requests in a React component while managing
 * its state and preventing errors that can occur when the component is unmounted.
 */
const useWalletControllerRequest = <TReqArgs extends any[] = any[], TRet = any>(
  requestFn: (...args: TReqArgs) => TRet | Promise<TRet>,
  {
    onSuccess,
    onError
  }: {
    onSuccess?(ret: TRet, opts: { args: TReqArgs }): void
    onError?(arg: Error): void
  }
) => {
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true

    return () => {
      mounted.current = false
    }
  }, [])
  const [loading, setLoading] = useState<boolean>(false)
  const [res, setRes] = useState<any>()
  const [err, setErr] = useState<any>()

  const run = async (...args: TReqArgs) => {
    setLoading(true)
    try {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const _res = await Promise.resolve(requestFn(...args))
      if (!mounted.current) {
        return
      }
      setRes(_res)
      onSuccess && onSuccess(_res, { args })
    } catch (e: any) {
      if (!mounted.current) {
        return
      }
      setErr(e)
      onError && onError(e)
    } finally {
      if (mounted.current) {
        setLoading(false)
      }
    }
  }

  return [run, loading, res, err] as const
}

export default useWalletControllerRequest
