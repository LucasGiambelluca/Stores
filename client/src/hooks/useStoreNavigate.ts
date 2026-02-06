import { useNavigate, NavigateOptions, To } from 'react-router-dom';
import { appendStoreId } from '../utils/storeDetection';

export const useStoreNavigate = () => {
  const navigate = useNavigate();

  const storeNavigate = (to: To | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to as any);
      return;
    }

    if (typeof to === 'string') {
      const toWithStore = appendStoreId(to);
      navigate(toWithStore, options);
    } else {
      // Handle object location
      const pathname = to.pathname ? appendStoreId(to.pathname) : undefined;
      navigate({ ...to, pathname }, options);
    }
  };

  return storeNavigate;
};
