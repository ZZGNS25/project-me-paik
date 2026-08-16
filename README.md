# 이어롤

길게 놀아도 캐릭터 설정이 이어지는 개인용 스토리 롤플 채팅.

기획 화면 A(키) → B(설정) → C(채팅)를 Next.js 라우트로 옮긴 뼈대입니다.  
API 키·설정·채팅·요약은 **LocalStorage**에 바로 저장하고, 로그인한 경우에만 Supabase에 올릴 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

`.env.example`을 참고해 `.env.local`을 만듭니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Gemini API 키는 환경 변수가 아닙니다. 시작 화면에서 입력하고 브라우저에만 둡니다.

## 화면

| 경로 | 기획 | 하는 일 |
|------|------|---------|
| `/` | 화면 A | AI Studio 발급 링크, 키 입력, 이어서 하기 |
| `/setup` | 화면 B | 프로필·세계관·유저·등장인물 메모 |
| `/chat` | 화면 C | 왼쪽 기억 패널 + 채팅 + 기억 압축 |

## 폴더

```
app/            화면 A/B/C
components/     공통 UI
hooks/          LocalStorage 상태, Auth
lib/            Gemini, 프롬프트, 파서, Supabase
supabase/       테이블 SQL
```

## Vercel

앱은 저장소 **루트**에 있습니다.

1. Framework Preset: **Next.js**
2. Root Directory: 비워 두기 (`.`)
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가
4. Supabase Authentication → URL Configuration에 배포 주소를 Redirect URL로 추가
