type IconName =
  | "menu"
  | "compress"
  | "pin"
  | "edit"
  | "regen"
  | "trash"
  | "close"
  | "check"
  | "resend"
  | "prev"
  | "next";

type IconProps = {
  name: IconName;
  size?: number;
};

const PATHS: Record<IconName, string[]> = {
  menu: ["M4 7h16M4 12h16M4 17h16"],
  compress: ["M4 8l8-3.5L20 8l-8 3.5L4 8Z", "M4 12.5 12 16l8-3.5", "M4 16.5 12 20l8-3.5"],
  pin: ["M12 16v6", "M7.5 3.5h9l-1 7h3.5L12 16.5 5 10.5h3.5l-1-7Z"],
  edit: [
    "M4 20h4.2L19 9.2a1.5 1.5 0 0 0 0-2.1L16.9 5a1.5 1.5 0 0 0-2.1 0L5 14.8V20Z",
    "M13.5 6.5 17.5 10.5",
  ],
  regen: ["M20 12a8 8 0 1 1-2.3-5.6", "M20 4.2V9h-4.8"],
  trash: ["M5 7h14", "M9.5 7V5.5h5V7", "M8.2 7l.8 12.2h6l.8-12.2"],
  close: ["M6 6l12 12", "M18 6 6 18"],
  check: ["M5 12.5 9.8 17 19 7"],
  resend: ["M5 12h12", "M13 7l5 5-5 5"],
  prev: ["M14.5 6 8.5 12l6 6"],
  next: ["M9.5 6l6 6-6 6"],
};

export default function Icon({ name, size = 18 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
