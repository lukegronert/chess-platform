export enum CurriculumItemType {
  PDF = 'PDF',
  GAME_REPLAY = 'GAME_REPLAY',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  TEXT_NOTE = 'TEXT_NOTE',
}

export interface Pdf {
  id: string;
  title: string;
  description: string | null;
  r2Key: string;
  fileSize: number;
  uploaderId: string;
  uploader: { id: string; displayName: string };
  classId: string | null;
  createdAt: string;
}

export interface Assignment {
  id: string;
  pdfId: string;
  pdf: Pdf;
  studentId: string;
  assignedAt: string;
  dueAt: string | null;
  completedAt: string | null;
}

export interface CurriculumItem {
  id: string;
  classId: string;
  title: string;
  description: string | null;
  type: CurriculumItemType;
  position: number;
  pdfId: string | null;
  pdf: Pdf | null;
  gameId: string | null;
  externalUrl: string | null;
  textContent: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  authorId: string;
  author: { id: string; displayName: string };
  classId: string | null;
  title: string;
  body: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  r2Key: string;
}
