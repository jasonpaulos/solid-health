import { storage } from './storage';
import { registration } from './registration';

export function loadServices() {
  return Promise.all([
    registration.load()
  ]);
}

export {
  storage,
  registration,
};
