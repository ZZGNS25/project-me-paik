import AvatarCircle from "@/components/AvatarCircle";

type ProfileCardProps = {
  name: string;
  oneLiner?: string;
  photo?: string;
  meta?: string;
  status?: string;
  statusIdle?: boolean;
  size?: "sm" | "md" | "lg";
};

export default function ProfileCard({
  name,
  oneLiner,
  photo,
  meta,
  status,
  statusIdle = false,
  size = "sm",
}: ProfileCardProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarCircle src={photo} name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate font-semibold">{name.trim() || "이름 없음"}</p>
        {oneLiner ? (
          <p className="mt-0.5 truncate text-sm text-[var(--ink-dim)]">{oneLiner}</p>
        ) : null}
        {status ? (
          <p className={`chat-status ${statusIdle ? "is-idle" : ""}`}>{status}</p>
        ) : meta ? (
          <p className="mt-0.5 text-xs text-[var(--blue-soft)]">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}
