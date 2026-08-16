type CharFieldProps = {
  label: string;
  value: string;
  max: number;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  required?: boolean;
};

export default function CharField({
  label,
  value,
  max,
  onChange,
  placeholder,
  hint,
  multiline = false,
  rows = 4,
  required = false,
}: CharFieldProps) {
  const shared = {
    value,
    maxLength: max,
    placeholder,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    className: "field-input",
  };

  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium text-[var(--ink)]">
          {label}
          {required ? <span className="ml-1 text-[var(--amber)]">*</span> : null}
        </span>
        <span className="mono-readout text-xs text-[var(--ink-dim)]">
          {value.length}/{max}
        </span>
      </span>
      {multiline ? (
        <textarea {...shared} rows={rows} />
      ) : (
        <input {...shared} type="text" />
      )}
      {hint ? (
        <span className="mt-1.5 block text-xs leading-relaxed text-[var(--ink-dim)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}
