import { loginFieldRow } from "@/lib/loginField";

const ROWS = 5;

export default function LoginField() {
  return (
    <div className="login-field" aria-hidden="true">
      {Array.from({ length: ROWS }, (_, row) => {
        const faces = loginFieldRow(row * 3);
        const belt = [...faces, ...faces];
        return (
          <div key={row} className={`login-field-row ${row % 2 === 0 ? "is-left" : "is-right"}`}>
            <div
              className="login-field-belt"
              style={{ animationDuration: `${90 + row * 12}s` }}
            >
              {belt.map((src, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`${src}-${index}`}
                  className="login-field-face"
                  src={src}
                  alt=""
                  width={72}
                  height={72}
                  draggable={false}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
