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

// Auth Providers
import {
    GoogleAuthProvider,
    FacebookAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Auth Functions
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Google", error);
        throw error;
    }
};

export const loginWithFacebook = async () => {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Facebook", error);
        throw error;
    }
};

export const loginWithEmail = async (email, password) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error logging in with Email", error);
        throw error;
    }
};

export const registerWithEmail = async (email, password) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error) {
        console.error("Error registering with Email", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error logging out", error);
        throw error;
    }
};

// Role-based access helper
export const getUserRole = async (user) => {
    if (!user) return null;
    try {
        const idTokenResult = await user.getIdTokenResult();
        // Returns custom claims like { admin: true, moderator: true }
        return idTokenResult.claims;
    } catch (error) {
        console.error("Error getting user role", error);
        return null;
    }
};
