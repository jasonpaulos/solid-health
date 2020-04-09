import { storage } from './storage';
import { registration } from './registration';
import * as session from './session';
import { fitness } from './fitness';

export function loadServices() {
  return Promise.all([
    registration.load(),
    session.load(),
    fitness.load(),
  ]);
}

export {
  storage,
  registration,
  fitness,
};
