type PageShellProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export default function PageShell({ children, wide = false }: PageShellProps) {
  return (
    <div className="paper-bg min-h-full flex-1">
      <div
        className={`page-enter relative mx-auto w-full px-5 py-8 sm:px-8 ${
          wide ? "max-w-6xl" : "max-w-xl"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
