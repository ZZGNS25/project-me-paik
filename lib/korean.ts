export function withWaGwa(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "이야기";
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${trimmed}와`;
  return (code - 0xac00) % 28 === 0 ? `${trimmed}와` : `${trimmed}과`;
}
