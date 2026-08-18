export function withWaGwa(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "이야기";
  const code = trimmed.charCodeAt(trimmed.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return `${trimmed}와`;
  return (code - 0xac00) % 28 === 0 ? `${trimmed}와` : `${trimmed}과`;
}

export function isBlankOrMeaningless(raw: string) {
  const text = raw
    .replace(/[\u00A0\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/[\uFF01-\uFF5E]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
    )
    .trim();
  if (!text) return true;
  if (/[가-힣]/.test(text)) return false;
  if (/[A-Za-z0-9]{2,}/.test(text)) return false;

  const compact = text.replace(/\s+/g, "");
  if (!compact) return true;
  if (isSilenceOrTone(compact)) return false;
  if (isChatEmoticon(compact)) return false;
  if (isChatSound(compact)) return false;
  if (isVowelExclaim(compact)) return false;
  if (isChoseongSlang(compact)) return false;

  const toned = peelTone(compact);
  if (toned !== compact) {
    if (!toned) return !/[ㅋㅎ]/.test(compact);
    if (isChatEmoticon(toned) || isChatSound(toned) || isVowelExclaim(toned)) {
      return false;
    }
    if (isChoseongSlang(toned)) return false;
  }

  const stem = peelLaugh(toned);
  if (stem && stem !== toned && isChoseongSlang(stem)) return false;
  const stemToned = peelTone(stem);
  if (stemToned && stemToned !== stem && isChoseongSlang(stemToned)) return false;
  return true;
}

const TONE = "[.·…⋯‥。．?!;~]";

function peelTone(text: string) {
  return text.replace(new RegExp(`^${TONE}+|${TONE}+$`, "g"), "");
}

function peelLaugh(text: string) {
  return text.replace(/[ㅋㅎ]+$/g, "");
}

function isSilenceOrTone(text: string) {
  if (new RegExp(`^[.·…⋯‥。．]+$`).test(text)) return true;
  if (/^[?!]+$/.test(text)) return true;
  if (/^;{2,}$/.test(text)) return true;
  if (/^~{2,}$/.test(text)) return true;
  if (/^\/{2,6}$/.test(text)) return true;
  return /[.·…⋯‥。．]/.test(text) && new RegExp(`^${TONE}+$`).test(text);
}

function isChatEmoticon(text: string) {
  if (/^\*?\^\^;{0,4}\*?$/.test(text)) return true;
  if (/^\^[_\-~oOㅁㅅvV]?\^;{0,4}$/.test(text)) return true;
  if (/^\(\^\^?\)$/.test(text)) return true;
  if (/^[:;8=]-?[)DPpoO(|\\/3]$/.test(text)) return true;
  if (/^(T[_.]?T|ToT|TwT|;_;|;_-|;-\(|>_<|;-\))$/i.test(text)) return true;
  if (/^(ㅡㅡ;{0,4}|\-\_\-;{0,4}|ㅡ[.,]*ㅡ;{0,4})$/.test(text)) return true;
  if (/^[ㅇㅎㅋㅁㅠㅜㅡ?!][ㅅㅂㅁ_.][ㅇㅎㅋㅁㅠㅜㅡ?!];{0,3}$/.test(text)) return true;
  if (/^(orz|OTL)$/i.test(text)) return true;
  return false;
}

function isChatSound(text: string) {
  if (/^[ㅋㅎ]+$/.test(text)) return true;
  if (/[ㅠㅜ]/.test(text) && /^[ㅠㅜㅡ]+$/.test(text)) return true;
  if (/[ㅋㅎ]/.test(text) && /^[ㅋㅎㅠㅜ]+$/.test(text)) return true;
  if (/^(ㅌ{2,}|ㅍㅎ+|ㅋㄷ+|ㄲ{2,}|ㄸㄹㄹ+)$/.test(text)) return true;
  if (/^(ㅋㄷ){2,}$/.test(text) || /^(ㅌㄷ){2,}$/.test(text)) return true;
  const laugh = (text.match(/[ㅋㅎ]/g) || []).length;
  if (laugh === 0) return false;
  if (!/^[ㅋㅎㄱㄲㅌㅍzZ]+$/.test(text)) return false;
  return laugh >= Math.ceil(text.length / 2);
}

function isVowelExclaim(text: string) {
  return /^(ㅗㅜㅑ|ㅓㅜㅑ|ㅗ+)$/.test(text);
}

const CHOSEONG = new Set(
  `
  ㅇ ㅇㅇ ㄴ ㄴㄴ ㅇㅋ ㅇㅈ ㄹㅇ ㅇㅎ ㄱㄴ ㅁㅈ ㅇㄱㄹㅇ ㅇㅋㄷㅋ ㄱㅇㄷ ㅇㅇㅈ ㄴㅇㅈ ㅇㄱㅇ
  ㄱㄱ ㄲ ㄱㄱㅅ ㄱㄷ ㄱㅈ ㄱㅂㅈㄱ ㄱㄹ ㄱㅊ ㄱㅊㄴ ㄱㅌ ㄱㅎ ㄱㅇㅇ ㄱㄷㄴ
  ㅎㅇ ㅎㅇㄹ ㅎ2 ㅎㅇㅌ ㅎㅌ ㅂㅂ ㅃㅃ ㅂㅇ ㅂ2 ㄱㅅ ㄳ ㅈㅅ ㅊㅋ ㅊㅊ ㅅㄱ ㅅㅊ ㄸㅋ
  ㄷㄷ ㅎㄷㄷ ㅎㄹ ㅁㄹ ㅇㄷ ㅁㅊ ㅁㅊㄴ ㅈㄴ ㅇㅉ ㅇㅈㄹ ㅈㄹ ㅉ ㅉㅉ
  ㅂㄷㅂㄷ ㄸㄹㄹ ㅎㄱ ㄲㄲ ㄲㅂ ㄲㅈ ㄴㄷ ㅂㄹ ㄴㅇ ㄴㅇㅅ ㄹㅈㄷ ㅁㅇ ㅈㅂ ㅈㅈ ㅈㄱ ㅈㄱㄴ
  ㅅㅂ ㅆㅂ ㅂㅅ ㅄ ㅅㄲ ㅅㄹ ㅅㄹㅎ ㄴㅈ ㄵ ㄴㄱ ㅂㅋ ㅁ ㅇㄴ ㅇㅉㄹㄱ ㅇㅁㅇㄱ ㅅㅅ
  `.trim().split(/\s+/),
);

function isChoseongSlang(text: string) {
  if (CHOSEONG.has(text)) return true;
  if (/^(ㅇ+|ㄴ+|ㄷㄷ+|ㄱㄱ+|ㄲ+|ㅂㅂ+|ㅃ+|ㅉ+|ㅅㅅ+|ㅊㅊ+|ㅎㄹ+)$/.test(text)) return true;
  if (/^(ㅎㄷㄷ+)$/.test(text) || /^(ㅂㄷ){2,}$/.test(text)) return true;
  for (const token of CHOSEONG) {
    if (text === `${token}ㅇ`) return true;
    if (text === token + token || text === token + token + token) return true;
    if (
      text.startsWith(token) &&
      text.length > token.length &&
      [...text.slice(token.length)].every((ch) => ch === token[token.length - 1])
    ) {
      return true;
    }
  }
  return false;
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
