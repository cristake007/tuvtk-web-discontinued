import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ElementSortabil = {
  is_separator: boolean;
  key: string;
  label: string;
};

type ListaMeniuSortabilaProps<Element extends ElementSortabil> = {
  disabled?: boolean;
  elemente: Element[];
  onSchimbaOrdinea: (elemente: Element[]) => void;
  onStergeSeparator?: (key: string) => void;
};

export function ListaMeniuSortabila<Element extends ElementSortabil>({
  disabled = false,
  elemente,
  onSchimbaOrdinea,
  onStergeSeparator,
}: ListaMeniuSortabilaProps<Element>) {
  const senzori = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function finalizeazaTragerea(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const sursa = elemente.findIndex((element) => element.key === active.id);
    const destinatie = elemente.findIndex((element) => element.key === over.id);
    if (sursa < 0 || destinatie < 0) {
      return;
    }

    onSchimbaOrdinea(arrayMove(elemente, sursa, destinatie));
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={finalizeazaTragerea}
      sensors={senzori}
    >
      <SortableContext
        items={elemente.map((element) => element.key)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y rounded-lg border" role="list">
          {elemente.map((element) => (
            <ElementMeniuSortabil
              disabled={disabled}
              element={element}
              key={element.key}
              onStergeSeparator={onStergeSeparator}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function ElementMeniuSortabil<Element extends ElementSortabil>({
  disabled,
  element,
  onStergeSeparator,
}: {
  disabled: boolean;
  element: Element;
  onStergeSeparator?: (key: string) => void;
}) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: element.key, disabled });
  const stil = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 transition-colors",
        isDragging && "z-10 bg-primary/5 opacity-40 shadow-sm",
      )}
      ref={setNodeRef}
      role="listitem"
      style={stil}
    >
      <button
        aria-label={`Trage ${element.label} pentru a-i schimba poziția`}
        className="cursor-grab rounded-sm p-1 text-muted-foreground hover:bg-primary/5 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        type="button"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" className="size-5" />
      </button>
      <span className={cn("min-w-0 flex-1 font-medium", element.is_separator && "text-muted-foreground")}>
        {element.is_separator ? "Separator" : element.label}
      </span>
      {element.is_separator && onStergeSeparator ? (
        <Button
          disabled={disabled}
          onClick={() => onStergeSeparator(element.key)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Elimină
        </Button>
      ) : null}
    </div>
  );
}
