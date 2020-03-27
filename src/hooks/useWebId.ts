import { useContext, useState } from 'react';
import { WebIdContext } from '../contexts';

export function useWebId() {
  return useContext(WebIdContext);
}
