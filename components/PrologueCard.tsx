type PrologueCardProps = {
  text: string;
  compact?: boolean;
};

export default function PrologueCard({ text, compact = false }: PrologueCardProps) {
  if (!text.trim()) return null;

  if (compact) {
    return (
      <details className="prologue-card is-compact">
        <summary className="label-caps cursor-pointer">프롤로그</summary>
        <p className="prologue-body">{text}</p>
      </details>
    );
  }

  return (
    <article className="prologue-card">
      <p className="label-caps">프롤로그</p>
      <p className="prologue-body">{text}</p>
    </article>
  );
}
