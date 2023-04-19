import { createGlobalState } from 'react-use';
import { Package } from '../../../types/types';

export const useSetCurrentPkgRunning = createGlobalState<Package | undefined>();
export const useSetLastPkgRunning = createGlobalState<Package | undefined>();
