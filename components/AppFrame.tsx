"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrandLockup from "@/components/BrandLockup";
import { useConfirm } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useStartFresh } from "@/hooks/useStartFresh";

const NAV = [
  { href: "/", view: null, label: "이야기" },
  { href: "/setup", view: null, label: "시나리오" },
  { href: "/?view=profiles", view: "profiles", label: "프로필" },
  { href: "/?view=history", view: "history", label: "내 기록" },
  { href: "/?view=guide", view: "guide", label: "안내" },
] as const;

type AppFrameProps = {
  children: React.ReactNode;
};

export default function AppFrame({ children }: AppFrameProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const view = searchParams.get("view");
  const confirm = useConfirm();
  const fresh = useStartFresh();

  function isActive(item: (typeof NAV)[number]) {
    if (item.href === "/setup") return pathname === "/setup";
    if (item.view) return pathname === "/" && view === item.view;
    return pathname === "/" && !view;
  }

  return (
    <div className="app-frame">
      <aside className="side-rail">
        <Link href="/" className="side-brand">
          <BrandLockup compact layout="row" />
        </Link>

        <button type="button" className="side-new" onClick={fresh.startStory}>
          새 시나리오
        </button>

        <nav className="mt-2 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`side-item ${isActive(item) ? "is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="side-account">
          {auth.user ? (
            <>
              <p className="side-account-email">
                {auth.isGuest ? "Guest" : auth.user.email}
              </p>
              {auth.isGuest ? (
                <p className="side-account-hint">
                  브라우저를 닫으면 모든 기록이 사라집니다.
                </p>
              ) : null}
              <button
                type="button"
                className="btn-quiet w-full"
                onClick={() =>
                  confirm.ask(
                    auth.isGuest
                      ? {
                          title: "로그아웃할까요?",
                          message: "로그아웃하면 이 Guest 기록이 모두 사라집니다.",
                          confirmLabel: "로그아웃",
                          run: () =>
                            void auth.signOut().then(() => router.replace("/")),
                        }
                      : {
                          message: "로그아웃할까요?",
                          confirmLabel: "로그아웃",
                          run: () =>
                            void auth.signOut().then(() => router.replace("/")),
                        },
                  )
                }
                disabled={auth.busy}
              >
                로그아웃
              </button>
            </>
          ) : null}
        </div>
      </aside>
      <div className="app-main">
        <div key={`${pathname}?${view ?? ""}`} className="page-enter">
          {children}
        </div>
      </div>
      {confirm.dialog}
      {fresh.dialog}
    </div>
  );
}
