import { useEffect, useRef } from 'react'

/**
 * Custom hook for setInterval with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval
  useEffect(() => {
    if (delay === null) return

    const tick = () => {
      savedCallback.current()
    }

    const id = setInterval(tick, delay)
    return () => clearInterval(id)
  }, [delay])
}
