import { firebaseConfig } from './firebase.local';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333',
  frontendUrl: 'http://localhost:4200',
  firebase: firebaseConfig
};
