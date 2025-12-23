import * as React from "react";

export function useDebouncedCallback(fn, delayMs) {
  const fnRef = React.useRef(fn);
  React.useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const timerRef = React.useRef(null);

  const debounced = React.useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delayMs);
    },
    [delayMs]
  );

  React.useEffect(() => {
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, []);

  return debounced;
}
