import { splitItalics } from "@/lib/parseMessage";

type MarkupTextProps = {
  text: string;
};

export default function MarkupText({ text }: MarkupTextProps) {
  return (
    <>
      {splitItalics(text).map((part, index) =>
        part.italic ? (
          <em key={index} className="mark-italic">
            {part.text}
          </em>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}
