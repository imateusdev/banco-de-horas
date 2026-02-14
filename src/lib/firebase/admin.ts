import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
    console.warn(
      '⚠️ Firebase Admin credentials not configured. API routes will not work until credentials are added to .env.local'
    );
    return;
  }

  try {
    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      databaseURL: `https://${projectId}.firebaseio.com`,
    });

    adminAuthInstance = getAuth(app);

    adminDbInstance = getFirestore(app, 'default');

    adminDbInstance.settings({
      ignoreUndefinedProperties: true,
      preferRest: false,
    });

    console.log('✅ Firebase Admin initialized successfully with Firestore Native Mode');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

initializeFirebaseAdmin();

export const adminAuth = adminAuthInstance as Auth;
export const adminDb = adminDbInstance as Firestore;

export function isFirebaseAdminInitialized(): boolean {
  return adminAuthInstance !== null && adminDbInstance !== null;
}
