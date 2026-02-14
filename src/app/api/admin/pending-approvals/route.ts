import { NextRequest } from 'next/server';
import { withAdminAccess } from '@/lib/server/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  return withAdminAccess(request, async () => {
    const pendingConversionsSnapshot = await adminDb
      .collection('hourConversions')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const pendingGoalsSnapshot = await adminDb
      .collection('monthlyGoals')
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    const userCache = new Map<string, any>();

    const getUserInfo = async (userId: string) => {
      if (userCache.has(userId)) {
        return userCache.get(userId);
      }

      try {
        const authUser = await adminAuth.getUser(userId);
        const userInfo = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName,
        };
        userCache.set(userId, userInfo);
        return userInfo;
      } catch {
        return { uid: userId, email: 'Unknown', displayName: 'Unknown' };
      }
    };

    const conversions = await Promise.all(
      pendingConversionsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userInfo = await getUserInfo(data.userId);
        return {
          id: doc.id,
          userId: data.userId,
          userEmail: userInfo.email,
          userName: userInfo.displayName || userInfo.email,
          hours: data.hours,
          amount: data.amount,
          type: data.type,
          date: data.date.toDate().toISOString().split('T')[0],
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
        };
      })
    );

    const goals = await Promise.all(
      pendingGoalsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userInfo = await getUserInfo(data.userId);
        return {
          id: doc.id,
          userId: data.userId,
          userEmail: userInfo.email,
          userName: userInfo.displayName || userInfo.email,
          month: data.month,
          hoursGoal: data.hoursGoal,
          status: data.status,
          createdAt: data.createdAt.toDate().toISOString(),
        };
      })
    );

    return Response.json({
      conversions,
      goals,
      total: conversions.length + goals.length,
    });
  });
}
