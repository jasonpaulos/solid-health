import { storage } from './storage';
import { registration } from './registration';
import * as session from './session';

export function loadServices() {
  return Promise.all([
    registration.load(),
    session.load(),
  ]);
}

export {
  storage,
  registration,
};
