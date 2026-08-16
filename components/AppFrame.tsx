"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlayState } from "@/hooks/usePlayState";

const NAV = [
  { href: "/", view: null, label: "작성" },
  { href: "/?view=guide", view: "guide", label: "안내" },
  { href: "/?view=history", view: "history", label: "내 기록" },
  { href: "/setup", view: null, label: "설정" },
] as const;

type AppFrameProps = {
  children: React.ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const play = usePlayState();
  const view = searchParams.get("view");

  function isActive(item: (typeof NAV)[number]) {
    if (item.href === "/setup") return pathname === "/setup";
    if (item.view) return pathname === "/" && view === item.view;
    return pathname === "/" && !view;
  }

  function handleWrite() {
    play.startNewStory();
    router.push("/");
  }

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <Link href="/" className="side-brand">
          <span className="gemini-mark text-xs font-semibold text-white">이</span>
          <span>이어롤</span>
        </Link>

        <nav className="mt-6 flex flex-1 flex-col gap-1">
          {NAV.map((item) =>
            item.label === "작성" ? (
              <button
                key={item.label}
                type="button"
                className={`side-item ${isActive(item) ? "is-active" : ""}`}
                onClick={handleWrite}
              >
                {item.label}
              </button>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={`side-item ${isActive(item) ? "is-active" : ""}`}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="mt-auto space-y-2 pt-4">
          {auth.user ? (
            <>
              <p className="truncate px-3 text-xs text-[var(--ink-dim)]">
                {auth.user.email}
              </p>
              <button
                type="button"
                className="side-item"
                onClick={auth.signOut}
                disabled={auth.busy}
              >
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
