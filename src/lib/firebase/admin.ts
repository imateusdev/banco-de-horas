import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

// Initialize Firebase Admin (only once)
function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // During build, Next.js tries to prerender API routes but Firebase Admin SDK
  // requires valid credentials. We skip initialization if credentials are not configured.
  if (!projectId || !clientEmail || !privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
    console.warn('⚠️ Firebase Admin credentials not configured. API routes will not work until credentials are added to .env.local');
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

    // Obter Firestore instance usando o database ID correto
    // O database se chama "default" (sem parênteses) conforme mostrado no Console
    adminDbInstance = getFirestore(app, 'default');

    // Configurar settings do Firestore
    adminDbInstance.settings({
      ignoreUndefinedProperties: true,
      preferRest: false, // Usar gRPC ao invés de REST
    });

    console.log('✅ Firebase Admin initialized successfully with Firestore Native Mode');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

// Initialize on module load
initializeFirebaseAdmin();

// Export instances (may be null if not initialized)
export const adminAuth = adminAuthInstance as Auth;
export const adminDb = adminDbInstance as Firestore;

// Helper to check if Firebase Admin is initialized
export function isFirebaseAdminInitialized(): boolean {
  return adminAuthInstance !== null && adminDbInstance !== null;
}
