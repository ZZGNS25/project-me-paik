import Link from "next/link";

type AppHeaderProps = {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
};

export default function AppHeader({
  eyebrow = "이어롤",
  title,
  right,
}: AppHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="label-caps">{eyebrow}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--ink)]">
          {title}
        </h1>
      </div>
      {right ?? (
        <Link href="/" className="ghost-link">
          처음으로
        </Link>
      )}
    </header>
  );
}
