import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { environment } from '../../environments/environment';

export const firebaseApp = initializeApp(environment.firebase);
export const auth = getAuth(firebaseApp);
