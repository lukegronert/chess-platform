import type { User } from './user.js';

export interface Class {
  id: string;
  name: string;
  description: string | null;
  teacherId: string;
  teacher: { id: string; displayName: string };
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  enrollmentCount?: number;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  student: Pick<User, 'id' | 'displayName' | 'email' | 'avatarUrl'>;
  enrolledAt: string;
}

export interface ClassGroup {
  id: string;
  classId: string;
  name: string;
  createdAt: string;
  members: { userId: string; user: Pick<User, 'id' | 'displayName'> }[];
}

export interface CreateClassRequest {
  name: string;
  description?: string;
  teacherId: string;
}

export interface CreateGroupRequest {
  name: string;
}
