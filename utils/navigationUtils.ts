import { NavigateFunction, NavigateOptions, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Executes lightweight, rock-solid page navigation.
 */
export const transitionNavigate = (
  navigate: NavigateFunction,
  to: string,
  options?: NavigateOptions
): void => {
  navigate(to, options);
};

/**
 * Hook providing a navigate function.
 */
export const useTransitionNavigate = () => {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: NavigateOptions) => {
      navigate(to, options);
    },
    [navigate]
  );
};
