import EarRoleMark from "@/components/EarRoleMark";

type BrandLockupProps = {
  compact?: boolean;
  layout?: "stack" | "row";
};

export default function BrandLockup({
  compact = false,
  layout = "stack",
}: BrandLockupProps) {
  return (
    <span
      className={`brand-lockup ${compact ? "is-compact" : ""} ${
        layout === "row" ? "is-row" : ""
      }`}
    >
      <EarRoleMark size={compact ? 28 : layout === "row" ? 34 : 52} />
      <span className="brand-en">EarRole</span>
    </span>
  );
}
