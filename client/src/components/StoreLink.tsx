import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { appendStoreId } from '../utils/storeDetection';

/**
 * StoreLink Component
 * 
 * A wrapper around react-router-dom's Link that automatically preserves
 * the storeId query parameter in the URL.
 */
export const StoreLink: React.FC<LinkProps> = ({ to, ...props }) => {
  const toWithStore = typeof to === 'string' 
    ? appendStoreId(to)
    : { ...to, pathname: appendStoreId(to.pathname || '') };

  return <Link to={toWithStore} {...props} />;
};
