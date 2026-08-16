export function withWaGwa(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "이야기";
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${trimmed}와`;
  return (code - 0xac00) % 28 === 0 ? `${trimmed}와` : `${trimmed}과`;
}

export function timeAgo(iso: string, now = Date.now()) {
  const stamp = Date.parse(iso);
  if (!Number.isFinite(stamp)) return "";
  const seconds = Math.max(0, Math.floor((now - stamp) / 1000));
  if (seconds < 45) return "방금";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
  const days = Math.floor(seconds / 86400);
  if (days === 1) return "어제";
  if (days < 7) return `${days}일 전`;
  return new Date(stamp).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}
