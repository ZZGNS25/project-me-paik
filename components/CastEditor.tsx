import { FIELD_LIMITS } from "@/lib/constants";
import AvatarCircle from "@/components/AvatarCircle";
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
    <div className="cast-editor">
      <div className="cast-editor-toolbar">
        <p className="text-sm text-[var(--ink-dim)]">
          능력과 성격을 적습니다. 장면에서 한 행동은 넣지 않습니다.
        </p>
        <button type="button" className="btn-secondary" onClick={onAdd}>
          인물 추가
        </button>
      </div>
      {notes.length === 0 ? (
        <div className="cast-editor-empty">
          <p>아직 등장인물이 없습니다.</p>
          <p>이야기 중간에도 추가하고 고칠 수 있습니다.</p>
        </div>
      ) : (
        <div className="cast-editor-list">
          {notes.map((note, index) => (
            <article key={note.id} className="cast-editor-card">
              <div className="cast-editor-head">
                <AvatarCircle
                  src={note.photo}
                  name={note.name}
                  size="md"
                  editable
                  compact
                  onChange={(photo) => onUpdate(note.id, "photo", photo)}
                />
                <label className="cast-editor-name">
                  <span>이름</span>
                  <input
                    className="field-input mt-0"
                    placeholder={`등장인물 ${index + 1}`}
                    value={note.name}
                    maxLength={FIELD_LIMITS.castName}
                    onChange={(event) =>
                      onUpdate(note.id, "name", event.target.value)
                    }
                  />
                </label>
                <button
                  type="button"
                  className="btn-danger cast-editor-remove"
                  onClick={() => onRemove(note.id)}
                >
                  삭제
                </button>
              </div>
              <label className="cast-editor-note">
                <span className="cast-editor-note-label">
                  <span>인물 설정</span>
                  <span className="mono-readout">
                    {note.note.length}/{FIELD_LIMITS.castNote}
                  </span>
                </span>
                <textarea
                  className="field-input mt-0"
                  rows={5}
                  placeholder="능력의 작동 방식과 한계, 성격과 판단 기준"
                  value={note.note}
                  maxLength={FIELD_LIMITS.castNote}
                  onChange={(event) =>
                    onUpdate(note.id, "note", event.target.value)
                  }
                />
              </label>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
