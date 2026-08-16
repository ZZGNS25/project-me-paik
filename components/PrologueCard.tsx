type PrologueCardProps = {
  text: string;
  compact?: boolean;
};

export default function PrologueCard({ text, compact = false }: PrologueCardProps) {
  if (!text.trim()) return null;

  return (
    <article className={`prologue-card ${compact ? "is-compact" : ""}`}>
      <p className="label-caps">프롤로그</p>
      <p className="prologue-body">{text}</p>
    </article>
  );
}
