type EarRoleMarkProps = {
  size?: number;
  className?: string;
};

export default function EarRoleMark({ size = 48, className = "" }: EarRoleMarkProps) {
  return (
    <span className={`ear-mark ${className}`} style={{ width: size, height: size }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/earrole-mark.png" alt="" width={size} height={size} />
    </span>
  );
}
