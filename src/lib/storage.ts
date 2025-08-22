import { TimeRecord, MonthlyGoal, User } from '@/types';
import { prisma } from './prisma';

// Helper types for Prisma results
type PrismaTimeRecord = {
  id: string;
  userId: string;
  name: string;
  date: Date;
  type: string;
  startTime: string;
  endTime: string;
  totalHours: number;
  createdAt: Date;
};

type PrismaMonthlyGoal = {
  id: string;
  userId: string;
  month: string;
  hoursGoal: number;
  createdAt: Date;
};

type PrismaUser = {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
};

type PrismaHourConversion = {
  id: string;
  userId: string;
  hours: number;
  amount: number;
  type: string;
  date: Date;
  createdAt: Date;
};

export const storageUtils = {
  // Time Records
  async getTimeRecords(): Promise<TimeRecord[]> {
    try {
      const records = await prisma.timeRecord.findMany({
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return records.map((record: PrismaTimeRecord) => ({
        id: record.id,
        userId: record.userId,
        name: record.name,
        date: record.date.toISOString().split('T')[0],
        type: record.type as 'work' | 'time_off',
        startTime: record.startTime,
        endTime: record.endTime,
        totalHours: record.totalHours,
        createdAt: record.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading time records:', error);
      return [];
    }
  },

  async saveTimeRecord(record: TimeRecord): Promise<void> {
    try {
      await prisma.timeRecord.create({
        data: {
          id: record.id,
          userId: record.userId,
          name: record.name,
          date: new Date(record.date),
          type: record.type,
          startTime: record.startTime,
          endTime: record.endTime,
          totalHours: record.totalHours,
          createdAt: new Date(record.createdAt)
        }
      });
    } catch (error) {
      console.error('Error saving time record:', error);
      throw error;
    }
  },

  async updateTimeRecord(id: string, updatedRecord: Partial<TimeRecord>): Promise<void> {
    try {
      const updateData: Partial<{
        name: string;
        date: Date;
        type: string;
        startTime: string;
        endTime: string;
        totalHours: number;
      }> = {};
      
      if (updatedRecord.name !== undefined) updateData.name = updatedRecord.name;
      if (updatedRecord.date !== undefined) updateData.date = new Date(updatedRecord.date);
      if (updatedRecord.type !== undefined) updateData.type = updatedRecord.type;
      if (updatedRecord.startTime !== undefined) updateData.startTime = updatedRecord.startTime;
      if (updatedRecord.endTime !== undefined) updateData.endTime = updatedRecord.endTime;
      if (updatedRecord.totalHours !== undefined) updateData.totalHours = updatedRecord.totalHours;

      await prisma.timeRecord.update({
        where: { id },
        data: updateData
      });
    } catch (error) {
      console.error('Error updating time record:', error);
      throw error;
    }
  },

  async deleteTimeRecord(id: string): Promise<void> {
    try {
      await prisma.timeRecord.delete({
        where: { id }
      });
    } catch (error) {
      console.error('Error deleting time record:', error);
      throw error;
    }
  },

  // Monthly Goals
  async getMonthlyGoals(): Promise<MonthlyGoal[]> {
    try {
      const goals = await prisma.monthlyGoal.findMany({
        orderBy: [
          { month: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return goals.map((goal: PrismaMonthlyGoal) => ({
        id: goal.id,
        userId: goal.userId,
        month: goal.month,
        hoursGoal: goal.hoursGoal,
        createdAt: goal.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading monthly goals:', error);
      return [];
    }
  },

  async saveMonthlyGoal(goal: MonthlyGoal): Promise<void> {
    try {
      await prisma.monthlyGoal.upsert({
        where: {
          userId_month: {
            userId: goal.userId,
            month: goal.month
          }
        },
        update: {
          hoursGoal: goal.hoursGoal
        },
        create: {
          id: goal.id,
          userId: goal.userId,
          month: goal.month,
          hoursGoal: goal.hoursGoal,
          createdAt: new Date(goal.createdAt)
        }
      });
    } catch (error) {
      console.error('Error saving monthly goal:', error);
      throw error;
    }
  },

  async getMonthlyGoal(month: string, userId?: string): Promise<number> {
    try {
      const goal = await prisma.monthlyGoal.findFirst({
        where: {
          month,
          ...(userId && { userId })
        }
      });
      
      return goal ? goal.hoursGoal : 0;
    } catch (error) {
      console.error('Error getting monthly goal:', error);
      return 0;
    }
  },

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
      });
      
      return users.map((user: PrismaUser) => ({
        id: user.id,
        name: user.name,
        createdAt: user.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  },

  async saveUser(user: User): Promise<void> {
    try {
      const slug = storageUtils.generateUserSlug(user.name);
      
      await prisma.user.create({
        data: {
          id: user.id,
          name: user.name,
          slug,
          createdAt: new Date(user.createdAt)
        }
      });
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  },

  async getUserBySlug(slug: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { slug }
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.name,
        createdAt: user.createdAt.toISOString()
      };
    } catch (error) {
      console.error('Error getting user by slug:', error);
      return null;
    }
  },

  generateUserSlug(name: string): string {
    return name.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
      .slice(0, 20); // Limita tamanho
  },

  // Filtered methods by userId
  async getUserTimeRecords(userId: string): Promise<TimeRecord[]> {
    try {
      const records = await prisma.timeRecord.findMany({
        where: { userId },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return records.map((record: PrismaTimeRecord) => ({
        id: record.id,
        userId: record.userId,
        name: record.name,
        date: record.date.toISOString().split('T')[0],
        type: record.type as 'work' | 'time_off',
        startTime: record.startTime,
        endTime: record.endTime,
        totalHours: record.totalHours,
        createdAt: record.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading user time records:', error);
      return [];
    }
  },

  async getUserMonthlyGoals(userId: string): Promise<MonthlyGoal[]> {
    try {
      const goals = await prisma.monthlyGoal.findMany({
        where: { userId },
        orderBy: { month: 'desc' }
      });
      
      return goals.map((goal: PrismaMonthlyGoal) => ({
        id: goal.id,
        userId: goal.userId,
        month: goal.month,
        hoursGoal: goal.hoursGoal,
        createdAt: goal.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading user monthly goals:', error);
      return [];
    }
  },

  async getUserMonthlyGoal(userId: string, month: string): Promise<number> {
    try {
      const goal = await prisma.monthlyGoal.findUnique({
        where: {
          userId_month: {
            userId,
            month
          }
        }
      });
      
      return goal ? goal.hoursGoal : 0;
    } catch (error) {
      console.error('Error getting user monthly goal:', error);
      return 0;
    }
  },

  // Hour Conversions
  async getHourConversions(): Promise<import('@/types').HourConversion[]> {
    try {
      const conversions = await prisma.hourConversion.findMany({
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return conversions.map((conversion: PrismaHourConversion) => ({
        id: conversion.id,
        userId: conversion.userId,
        hours: conversion.hours,
        amount: conversion.amount,
        type: conversion.type as 'money' | 'time_off',
        date: conversion.date.toISOString().split('T')[0],
        createdAt: conversion.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading hour conversions:', error);
      return [];
    }
  },

  async getUserHourConversions(userId: string): Promise<import('@/types').HourConversion[]> {
    try {
      const conversions = await prisma.hourConversion.findMany({
        where: { userId },
        orderBy: [
          { date: 'desc' },
          { createdAt: 'desc' }
        ]
      });
      
      return conversions.map((conversion: PrismaHourConversion) => ({
        id: conversion.id,
        userId: conversion.userId,
        hours: conversion.hours,
        amount: conversion.amount,
        type: conversion.type as 'money' | 'time_off',
        date: conversion.date.toISOString().split('T')[0],
        createdAt: conversion.createdAt.toISOString()
      }));
    } catch (error) {
      console.error('Error loading user hour conversions:', error);
      return [];
    }
  },

  async saveHourConversion(conversion: import('@/types').HourConversion): Promise<void> {
    try {
      await prisma.hourConversion.create({
        data: {
          id: conversion.id,
          userId: conversion.userId,
          hours: conversion.hours,
          amount: conversion.amount,
          type: conversion.type,
          date: new Date(conversion.date),
          createdAt: new Date(conversion.createdAt)
        }
      });
    } catch (error) {
      console.error('Error saving hour conversion:', error);
      throw error;
    }
  }
};
