import { app, db } from './config';
import { auth } from './auth';

// Simple initialization without any complex configurations
export const initializeFirebase = async () => {
  return true;
};

export { app, db, auth };