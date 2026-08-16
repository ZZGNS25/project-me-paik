type IconName = "menu" | "compress" | "pin";

type IconProps = {
  name: IconName;
  size?: number;
};

export default function Icon({ name, size = 18 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  if (name === "menu") {
    return (
      <svg {...props}>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }

  if (name === "compress") {
    return (
      <svg {...props}>
        <path d="M4 8l8-3.5L20 8l-8 3.5L4 8Z" />
        <path d="M4 12.5 12 16l8-3.5" />
        <path d="M4 16.5 12 20l8-3.5" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <path d="M12 16v6" />
      <path d="M7.5 3.5h9l-1 7h3.5L12 16.5 5 10.5h3.5l-1-7Z" />
    </svg>
  );
}
