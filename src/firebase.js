// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDIxBhXWSB7RlW_FBVpaAhRV_bpZiClPz8",
    authDomain: "clearcomment-7f6f8.firebaseapp.com",
    projectId: "clearcomment-7f6f8",
    storageBucket: "clearcomment-7f6f8.firebasestorage.app",
    messagingSenderId: "221252029808",
    appId: "1:221252029808:web:5eee752bba7f5020aad3b5",
    measurementId: "G-HTGPCT1KN0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export the services
export { app, analytics, auth, db };
