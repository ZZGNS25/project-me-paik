import { createClient } from "@supabase/supabase-js";

export async function requireUser(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!token) {
    return { user: null, error: "로그인이 필요합니다." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return { user: null, error: "Supabase 환경 변수가 없습니다." };
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
  }

  return { user: data.user, error: null };
}
