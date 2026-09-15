export interface MarkdownLine {
  /** Where the line sits in the source: stable while its text is edited. */
  id: number;
  text: string;
}

export type MarkdownBlock = { id: number } & (
  | { kind: "heading"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly MarkdownLine[] }
);

const HEADING = /^#{1,6}\s+(.*)$/;
const BULLET = /^[-*]\s+(.*)$/;

/** Minimal markdown to blocks: headings, bullets, paragraphs. */
export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let list: MarkdownLine[] | null = null;
  let paragraph: MarkdownLine[] = [];

  const flushParagraph = () => {
    const first = paragraph[0];
    if (first !== undefined) {
      blocks.push({
        id: first.id,
        kind: "paragraph",
        text: paragraph.map((line) => line.text).join(" "),
      });
      paragraph = [];
    }
  };
  const flushList = () => {
    const first = list?.[0];
    if (list !== null && first !== undefined) {
      blocks.push({ id: first.id, kind: "list", items: list });
      list = null;
    }
  };

  source.split("\n").forEach((raw, index) => {
    const line = raw.trim();
    const heading = HEADING.exec(line);
    const bullet = BULLET.exec(line);
    if (line === "") {
      flushParagraph();
      flushList();
    } else if (heading?.[1] !== undefined) {
      flushParagraph();
      flushList();
      blocks.push({ id: index, kind: "heading", text: heading[1] });
    } else if (bullet?.[1] !== undefined) {
      flushParagraph();
      list ??= [];
      list.push({ id: index, text: bullet[1] });
    } else {
      flushList();
      paragraph.push({ id: index, text: line });
    }
  });
  flushParagraph();
  flushList();
  return blocks;
}
