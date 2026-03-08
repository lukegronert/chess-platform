import { ClassBoard } from '@/components/messaging/ClassBoard';

interface PageProps {
  params: { id: string };
}

export default function StudentClassBoardPage({ params }: PageProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="font-bold text-gray-900">Class Message Board</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <ClassBoard classId={params.id} canPost />
      </div>
    </div>
  );
}
