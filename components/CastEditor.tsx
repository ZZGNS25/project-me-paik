import { FIELD_LIMITS } from "@/lib/constants";
import type { CastNote } from "@/lib/types";

type CastEditorProps = {
  notes: CastNote[];
  onAdd: () => void;
  onUpdate: (id: string, key: keyof CastNote, value: string) => void;
  onRemove: (id: string) => void;
};

export default function CastEditor({
  notes,
  onAdd,
  onUpdate,
  onRemove,
}: CastEditorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label-caps">등장인물</p>
        <button type="button" className="btn-quiet" onClick={onAdd}>
          추가
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-[var(--ink-dim)]">
          이야기 중간에도 인물을 넣을 수 있습니다.
        </p>
      ) : (
        notes.map((note) => (
          <div key={note.id} className="grid gap-3 sm:grid-cols-[8rem_1fr_auto]">
            <input
              className="field-input mt-0"
              placeholder="이름"
              value={note.name}
              maxLength={FIELD_LIMITS.castName}
              onChange={(event) => onUpdate(note.id, "name", event.target.value)}
            />
            <input
              className="field-input mt-0"
              placeholder="한 줄 메모"
              value={note.note}
              maxLength={FIELD_LIMITS.castNote}
              onChange={(event) => onUpdate(note.id, "note", event.target.value)}
            />
            <button
              type="button"
              className="btn-danger self-center"
              onClick={() => onRemove(note.id)}
            >
              삭제
            </button>
          </div>
        ))
      )}
    </div>
  );
}
