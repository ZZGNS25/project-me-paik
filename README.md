# 이어롤

길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅.

Google 로그인 후 바로 설정·채팅을 시작합니다. Gemini 키는 서버에만 두고, 설정·채팅·요약은 LocalStorage에 저장합니다.

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
GEMINI_API_KEY=
```

`GEMINI_API_KEY`는 서버 전용입니다. `NEXT_PUBLIC_`을 붙이지 마세요.

## 화면

| 경로 | 기획 | 하는 일 |
|------|------|---------|
| `/` | 화면 A | Google 로그인, 이어서 하기 |
| `/setup` | 화면 B | 프로필·세계관·유저·등장인물 메모 |
| `/chat` | 화면 C | 왼쪽 기억 패널 + 채팅 + 기억 압축 |

## 폴더

```
app/            화면 A/B/C, /api/generate
components/     공통 UI
hooks/          LocalStorage 상태, Auth
lib/            Gemini, 프롬프트, 파서, Supabase
supabase/       테이블 SQL
```

## Vercel

앱은 저장소 **루트**에 있습니다.

1. Framework Preset: **Next.js**
2. Root Directory: 비워 두기 (`.`)
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY` 추가
4. Supabase Authentication → URL Configuration에 `https://project-me-paik.vercel.app/**` 과 `http://localhost:3000/**` 을 Redirect URL로 추가
