import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
// In production (Railway), we'll use environment variables for the service account
// or the default Google Application Credentials if running on GCP/Firebase Functions.
// For Railway, passing the service account JSON as a base64 env var or individual fields is common.

let serviceAccount: any;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        console.warn('FIREBASE_SERVICE_ACCOUNT env var not found. Attempting default init...');
    }
} catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT:', error);
}

const app = admin.apps.length === 0 ? admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID || 'clearcomment-7f6f8'
}) : admin.app();

export const db = app.firestore();
export const auth = app.auth();

export default app;
