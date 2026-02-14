import { NextRequest } from 'next/server';
import { unauthorized, serverError } from '@/lib/server/auth';
import { adminAuth } from '@/lib/firebase/admin';
import { getPreAuthorizedEmail } from '@/lib/server/firestore';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized();
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (decodedToken.authorized && decodedToken.role) {
      return Response.json({
        authorized: true,
        role: decodedToken.role,
        email: decodedToken.email,
        uid: decodedToken.uid,
      });
    }

    const userEmail = decodedToken.email;
    if (!userEmail) {
      return Response.json({
        authorized: false,
        uid: decodedToken.uid,
      });
    }

    const listUsersResult = await adminAuth.listUsers();
    let hasAuthorizedUsers = false;

    for (const authUser of listUsersResult.users) {
      if (authUser.customClaims?.authorized) {
        hasAuthorizedUsers = true;
        break;
      }
    }

    if (!hasAuthorizedUsers) {
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        authorized: true,
        role: 'admin',
      });

      return Response.json({
        authorized: true,
        role: 'admin',
        email: userEmail,
        uid: decodedToken.uid,
        firstUser: true,
      });
    }

    const preAuthorized = await getPreAuthorizedEmail(userEmail);

    if (preAuthorized) {
      await adminAuth.setCustomUserClaims(decodedToken.uid, {
        authorized: true,
        role: preAuthorized.role,
      });

      return Response.json({
        authorized: true,
        role: preAuthorized.role,
        email: userEmail,
        uid: decodedToken.uid,
        autoAuthorized: true,
      });
    }

    return Response.json({
      authorized: false,
      email: userEmail,
      uid: decodedToken.uid,
    });
  } catch (error) {
    console.error('Error checking authorization:', error);
    return serverError('Failed to check authorization');
  }
}
