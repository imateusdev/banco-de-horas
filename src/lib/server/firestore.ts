import { adminDb } from '@/lib/firebase/admin';
import { TimeRecord, MonthlyGoal, User, HourConversion, UserSettings, AIReport } from '@/types';
import { Timestamp } from 'firebase-admin/firestore';

export async function getTimeRecordsByUser(userId: string): Promise<TimeRecord[]> {
  try {
    const snapshot = await adminDb
      .collection('timeRecords')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .limit(500)
      .get();

    const records = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        name: data.name,
        date: data.date.toDate().toISOString().split('T')[0],
        type: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        totalHours: data.totalHours,
        description: data.description || undefined,
        createdAt: data.createdAt.toDate().toISOString(),
      };
    });
    return records;
  } catch (error: any) {
    if (error?.code === 5 || error?.message?.includes('does not exist')) {
      console.warn('⚠️ Firestore collection not found, returning empty array');
      return [];
    }
    throw error;
  }
}

export async function getAllTimeRecords(): Promise<TimeRecord[]> {
  const snapshot = await adminDb
    .collection('timeRecords')
    .orderBy('date', 'desc')
    .orderBy('createdAt', 'desc')
    .limit(1000)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      date: data.date.toDate().toISOString().split('T')[0],
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime,
      totalHours: data.totalHours,
      description: data.description || undefined,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function createTimeRecord(record: TimeRecord): Promise<void> {
  const dataToSave = {
    userId: record.userId,
    name: record.name,
    date: Timestamp.fromDate(new Date(record.date)),
    type: record.type,
    startTime: record.startTime,
    endTime: record.endTime,
    totalHours: record.totalHours,
    description: record.description || null,
    createdAt: Timestamp.fromDate(new Date(record.createdAt)),
  };
  await adminDb.collection('timeRecords').doc(record.id).set(dataToSave);
}

export async function updateTimeRecord(
  id: string,
  userId: string,
  updates: Partial<TimeRecord>
): Promise<void> {
  const recordRef = adminDb.collection('timeRecords').doc(id);
  const doc = await recordRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('Record not found or unauthorized');
  }

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.date !== undefined) updateData.date = Timestamp.fromDate(new Date(updates.date));
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.startTime !== undefined) updateData.startTime = updates.startTime;
  if (updates.endTime !== undefined) updateData.endTime = updates.endTime;
  if (updates.totalHours !== undefined) updateData.totalHours = updates.totalHours;
  if (updates.description !== undefined) updateData.description = updates.description || null;

  await recordRef.update(updateData);
}

export async function deleteTimeRecord(id: string, userId: string): Promise<void> {
  const recordRef = adminDb.collection('timeRecords').doc(id);
  const doc = await recordRef.get();

  if (!doc.exists || doc.data()?.userId !== userId) {
    throw new Error('Record not found or unauthorized');
  }

  await recordRef.delete();
}

export async function getUser(userId: string): Promise<User | null> {
  const doc = await adminDb.collection('users').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    name: data.name,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function getUserBySlug(slug: string): Promise<User | null> {
  const snapshot = await adminDb.collection('users').where('slug', '==', slug).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function createUser(userId: string, user: User): Promise<void> {
  const slug = user.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 20);

  await adminDb
    .collection('users')
    .doc(userId)
    .set({
      name: user.name,
      slug,
      email: (await import('@/lib/firebase/admin')).adminAuth.getUser(userId).then((u) => u.email),
      createdAt: Timestamp.fromDate(new Date(user.createdAt)),
    });
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const doc = await adminDb.collection('userSettings').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    userId: data.userId,
    defaultStartTime: data.defaultStartTime,
    defaultEndTime: data.defaultEndTime,
    workingDays: data.workingDays,
    githubUsername: data.githubUsername || null,
    githubProjectId: data.githubProjectId || null,
    githubBranch: data.githubBranch || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function createOrUpdateUserSettings(
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> {
  const settingsRef = adminDb.collection('userSettings').doc(userId);
  const doc = await settingsRef.get();

  if (doc.exists) {
    await settingsRef.update({
      ...settings,
      updatedAt: Timestamp.now(),
    });
  } else {
    await settingsRef.set({
      userId,
      workingDays: settings.workingDays || 'weekdays',
      defaultStartTime: settings.defaultStartTime || null,
      defaultEndTime: settings.defaultEndTime || null,
      githubUsername: settings.githubUsername || null,
      githubProjectId: settings.githubProjectId || null,
      githubBranch: settings.githubBranch || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

export async function getUserMonthlyGoals(userId: string): Promise<MonthlyGoal[]> {
  const snapshot = await adminDb
    .collection('monthlyGoals')
    .where('userId', '==', userId)
    .orderBy('month', 'desc')
    .limit(24)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      month: data.month,
      hoursGoal: data.hoursGoal,
      status: data.status || 'approved',
      requestedBy: data.requestedBy || data.userId,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt?.toDate().toISOString(),
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function saveMonthlyGoal(goal: MonthlyGoal): Promise<void> {
  await adminDb
    .collection('monthlyGoals')
    .doc(goal.id)
    .set(
      {
        userId: goal.userId,
        month: goal.month,
        hoursGoal: goal.hoursGoal,
        status: goal.status,
        requestedBy: goal.requestedBy,
        approvedBy: goal.approvedBy || null,
        approvedAt: goal.approvedAt ? Timestamp.fromDate(new Date(goal.approvedAt)) : null,
        createdAt: Timestamp.fromDate(new Date(goal.createdAt)),
      },
      { merge: true }
    );
}

export async function getUserMonthlyGoal(userId: string, month: string): Promise<number> {
  const snapshot = await adminDb
    .collection('monthlyGoals')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .where('status', '==', 'approved')
    .limit(1)
    .get();

  if (snapshot.empty) return 0;

  return snapshot.docs[0].data().hoursGoal || 0;
}

export async function getUserMonthlyGoalWithStatus(
  userId: string,
  month: string
): Promise<MonthlyGoal | null> {
  const snapshot = await adminDb
    .collection('monthlyGoals')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    userId: data.userId,
    month: data.month,
    hoursGoal: data.hoursGoal,
    status: data.status || 'approved',
    requestedBy: data.requestedBy || data.userId,
    approvedBy: data.approvedBy,
    approvedAt: data.approvedAt?.toDate().toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function getUserHourConversions(userId: string): Promise<HourConversion[]> {
  const snapshot = await adminDb
    .collection('hourConversions')
    .where('userId', '==', userId)
    .orderBy('date', 'desc')
    .limit(200)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      hours: data.hours,
      amount: data.amount,
      type: data.type,
      date: data.date.toDate().toISOString().split('T')[0],
      status: data.status || 'approved',
      requestedBy: data.requestedBy || data.userId,
      approvedBy: data.approvedBy,
      approvedAt: data.approvedAt?.toDate().toISOString(),
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function createHourConversion(conversion: HourConversion): Promise<void> {
  await adminDb
    .collection('hourConversions')
    .doc(conversion.id)
    .set({
      userId: conversion.userId,
      hours: conversion.hours,
      amount: conversion.amount,
      type: conversion.type,
      date: Timestamp.fromDate(new Date(conversion.date)),
      status: conversion.status,
      requestedBy: conversion.requestedBy,
      approvedBy: conversion.approvedBy || null,
      approvedAt: conversion.approvedAt
        ? Timestamp.fromDate(new Date(conversion.approvedAt))
        : null,
      createdAt: Timestamp.fromDate(new Date(conversion.createdAt)),
    });
}

export interface PreAuthorizedEmail {
  email: string;
  role: 'admin' | 'collaborator';
  addedBy: string;
  addedAt: string;
}

export async function getPreAuthorizedEmails(): Promise<PreAuthorizedEmail[]> {
  try {
    const snapshot = await adminDb
      .collection('preAuthorizedEmails')
      .orderBy('addedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        email: doc.id,
        role: data.role || 'collaborator',
        addedBy: data.addedBy,
        addedAt: data.addedAt.toDate().toISOString(),
      };
    });
  } catch (error: any) {
    if (error?.code === 5 || error?.message?.includes('does not exist')) {
      console.warn('⚠️ Firestore collection not found, returning empty array');
      return [];
    }
    throw error;
  }
}

export async function getPreAuthorizedEmail(email: string): Promise<PreAuthorizedEmail | null> {
  try {
    const doc = await adminDb.collection('preAuthorizedEmails').doc(email.toLowerCase()).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data()!;
    return {
      email: doc.id,
      role: data.role || 'collaborator',
      addedBy: data.addedBy,
      addedAt: data.addedAt.toDate().toISOString(),
    };
  } catch (error: any) {
    if (error?.code === 5 || error?.message?.includes('does not exist')) {
      console.warn('⚠️ Firestore collection not found, returning null');
      return null;
    }
    throw error;
  }
}

export async function addPreAuthorizedEmail(
  email: string,
  role: 'admin' | 'collaborator',
  addedBy: string
): Promise<void> {
  await adminDb.collection('preAuthorizedEmails').doc(email.toLowerCase()).set({
    role,
    addedBy,
    addedAt: Timestamp.now(),
  });
}

export async function removePreAuthorizedEmail(email: string): Promise<void> {
  await adminDb.collection('preAuthorizedEmails').doc(email.toLowerCase()).delete();
}

export async function deleteAllUserData(userId: string): Promise<void> {
  const batch = adminDb.batch();
  let deletedCount = 0;

  const timeRecordsSnapshot = await adminDb
    .collection('timeRecords')
    .where('userId', '==', userId)
    .get();

  timeRecordsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;
  });

  const monthlyGoalsSnapshot = await adminDb
    .collection('monthlyGoals')
    .where('userId', '==', userId)
    .get();

  monthlyGoalsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;
  });

  const hourConversionsSnapshot = await adminDb
    .collection('hourConversions')
    .where('userId', '==', userId)
    .get();

  hourConversionsSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
    deletedCount++;
  });

  const userSettingsRef = adminDb.collection('userSettings').doc(userId);
  const userSettingsDoc = await userSettingsRef.get();
  if (userSettingsDoc.exists) {
    batch.delete(userSettingsRef);
    deletedCount++;
  }

  const userRef = adminDb.collection('users').doc(userId);
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    batch.delete(userRef);
    deletedCount++;
  }

  if (deletedCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Deleted ${deletedCount} documents for user ${userId}`);
}

export async function createAIReport(report: AIReport): Promise<void> {
  await adminDb
    .collection('aiReports')
    .doc(report.id)
    .set({
      userId: report.userId,
      userName: report.userName,
      userEmail: report.userEmail,
      month: report.month,
      reportContent: report.reportContent,
      generatedBy: report.generatedBy,
      generatedByName: report.generatedByName,
      stats: report.stats,
      createdAt: Timestamp.fromDate(new Date(report.createdAt)),
    });
}

export async function getAIReportsByUser(userId: string): Promise<AIReport[]> {
  const snapshot = await adminDb
    .collection('aiReports')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      month: data.month,
      reportContent: data.reportContent,
      generatedBy: data.generatedBy,
      generatedByName: data.generatedByName,
      stats: data.stats,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function getAIReport(reportId: string): Promise<AIReport | null> {
  const doc = await adminDb.collection('aiReports').doc(reportId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    month: data.month,
    reportContent: data.reportContent,
    generatedBy: data.generatedBy,
    generatedByName: data.generatedByName,
    stats: data.stats,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function getExistingAIReport(userId: string, month: string): Promise<AIReport | null> {
  const snapshot = await adminDb
    .collection('aiReports')
    .where('userId', '==', userId)
    .where('month', '==', month)
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();
  return {
    id: doc.id,
    userId: data.userId,
    userName: data.userName,
    userEmail: data.userEmail,
    month: data.month,
    reportContent: data.reportContent,
    generatedBy: data.generatedBy,
    generatedByName: data.generatedByName,
    stats: data.stats,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function getAllAIReports(): Promise<AIReport[]> {
  const snapshot = await adminDb
    .collection('aiReports')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data.userId,
      userName: data.userName,
      userEmail: data.userEmail,
      month: data.month,
      reportContent: data.reportContent,
      generatedBy: data.generatedBy,
      generatedByName: data.generatedByName,
      stats: data.stats,
      createdAt: data.createdAt.toDate().toISOString(),
    };
  });
}

export async function deleteAIReport(reportId: string): Promise<void> {
  await adminDb.collection('aiReports').doc(reportId).delete();
}
