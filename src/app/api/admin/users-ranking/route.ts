import { NextRequest } from 'next/server';
import { withAdminAccess } from '@/lib/server/api-helpers';
import { adminDb } from '@/lib/firebase/admin';
import { adminAuth } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  return withAdminAccess(request, async () => {
    const url = new URL(request.url);
    const month = url.searchParams.get('month');

    if (!month) {
      return Response.json({ error: 'Month parameter is required' }, { status: 400 });
    }

    const allRecordsSnapshot = await adminDb.collection('timeRecords').get();

    const userIdsSet = new Set<string>();
    allRecordsSnapshot.docs.forEach((doc) => {
      const userId = doc.data().userId;
      if (userId) userIdsSet.add(userId);
    });

    const uniqueUserIds = Array.from(userIdsSet);

    const userRankings = await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          let userInfo;
          try {
            const authUser = await adminAuth.getUser(userId);
            userInfo = {
              displayName: authUser.displayName || authUser.email,
              email: authUser.email,
            };
          } catch {
            userInfo = {
              displayName: 'Usuário Desconhecido',
              email: userId,
            };
          }

          const [recordsSnapshot, goalSnapshot] = await Promise.all([
            adminDb.collection('timeRecords').where('userId', '==', userId).get(),
            adminDb
              .collection('monthlyGoals')
              .where('userId', '==', userId)
              .where('month', '==', month)
              .orderBy('createdAt', 'desc')
              .limit(1)
              .get(),
          ]);

          let monthlyGoal = 176;
          if (!goalSnapshot.empty) {
            const goalData = goalSnapshot.docs[0].data();
            monthlyGoal = goalData.hoursGoal || 176;
          }

          let totalWorkHours = 0;
          let totalTimeOffHours = 0;
          let recordsCount = 0;

          recordsSnapshot.docs.forEach((recordDoc) => {
            const record = recordDoc.data();
            const recordDate = record.date?.toDate
              ? record.date.toDate().toISOString().split('T')[0]
              : record.date;

            if (recordDate && recordDate.startsWith(month)) {
              recordsCount++;
              if (record.type === 'work') {
                totalWorkHours += record.totalHours || 0;
              } else if (record.type === 'time_off') {
                totalTimeOffHours += record.totalHours || 0;
              }
            }
          });

          const netHours = totalWorkHours - totalTimeOffHours;
          const difference = netHours - monthlyGoal;

          return {
            userId,
            displayName: userInfo.displayName,
            email: userInfo.email,
            totalWorkHours,
            totalTimeOffHours,
            netHours,
            monthlyGoal,
            difference,
            isOverGoal: difference > 0,
            recordsCount,
          };
        } catch (error) {
          console.error(`Error processing user ${userId}:`, error);
          return null;
        }
      })
    );

    const validRankings = userRankings
      .filter((ranking) => ranking !== null && ranking.recordsCount > 0)
      .sort((a, b) => b!.netHours - a!.netHours);

    return Response.json({
      month,
      rankings: validRankings,
      total: validRankings.length,
    });
  });
}
