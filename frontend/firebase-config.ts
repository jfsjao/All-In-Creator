import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAzRuN1rYYgjwml3bkzhLw8ujlM8I8x9Xs",
  authDomain: "nicolwork-1.firebaseapp.com",
  projectId: "nicolwork-1",
  storageBucket: "nicolwork-1.firebasestorage.app",
  messagingSenderId: "213172189454",
  appId: "1:213172189454:web:006053d67129f1890f3f5f",
  measurementId: "G-FMEDQXDLZF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };