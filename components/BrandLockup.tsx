import EarRoleMark from "@/components/EarRoleMark";

type BrandLockupProps = {
  compact?: boolean;
};

export default function BrandLockup({ compact = false }: BrandLockupProps) {
  return (
    <span className={`brand-lockup ${compact ? "is-compact" : ""}`}>
      <EarRoleMark size={compact ? 30 : 40} />
      <span className="brand-en">EarRole</span>
    </span>
  );
}
