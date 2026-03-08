'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useState } from 'react';
import type { CurriculumItem } from '@chess/shared';

interface SortableItemProps {
  item: CurriculumItem;
  onEdit: (item: CurriculumItem) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border rounded-lg shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <div className="flex-1">
        <p className="font-medium text-sm">{item.title}</p>
        <p className="text-xs text-gray-500">{item.type}</p>
      </div>
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${
          item.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {item.isPublished ? 'Published' : 'Draft'}
      </span>
      <button
        onClick={() => onEdit(item)}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </button>
      <button
        onClick={() => onDelete(item.id)}
        className="text-sm text-red-500 hover:underline"
      >
        Delete
      </button>
    </div>
  );
}

interface CurriculumBuilderProps {
  classId: string;
}

export function CurriculumBuilder({ classId }: CurriculumBuilderProps) {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<CurriculumItem | null>(null);

  const { data: items = [] } = useQuery<CurriculumItem[]>({
    queryKey: ['curriculum', classId],
    queryFn: () => api.get(`/classes/${classId}/curriculum`),
  });

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) =>
      api.post(`/classes/${classId}/curriculum/reorder`, { orderedIds }),
    onMutate: async (orderedIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['curriculum', classId] });
      const prev = queryClient.getQueryData<CurriculumItem[]>(['curriculum', classId]);
      const reordered = orderedIds.map((id) => items.find((i) => i.id === id)!).filter(Boolean);
      queryClient.setQueryData(['curriculum', classId], reordered);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['curriculum', classId], ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['curriculum', classId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/classes/${classId}/curriculum/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['curriculum', classId] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    const newOrder = arrayMove(items, oldIdx, newIdx);
    reorderMutation.mutate(newOrder.map((i) => i.id));
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onEdit={setEditingItem}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {items.length === 0 && (
        <p className="text-center text-gray-400 py-8">No curriculum items yet. Add some below.</p>
      )}
    </div>
  );
}
