import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: 'AIzaSyAV6xP8H8bXbN_PwapoxfKF-GVf8sBttR4',
  authDomain: 'allin-creator.firebaseapp.com',
  projectId: 'allin-creator',
  storageBucket: 'allin-creator.firebasestorage.app',
  messagingSenderId: '616021068388',
  appId: '1:616021068388:web:c368e87aad67bdd0b62d71'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
