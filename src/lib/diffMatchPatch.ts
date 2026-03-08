import DiffMatchPatch from "diff-match-patch";

const DIFF_DELETE = -1;
const DIFF_INSERT = 1;
const DIFF_EQUAL = 0;

export interface DiffChunk {
  type: "add" | "remove" | "change" | "equal";
  text: string;
  lineNumber?: number;
}

export interface DiffResult {
  chunks: DiffChunk[];
  summary: {
    added: number;
    removed: number;
    changed: number;
  };
}

export function detectTextDiff(leftText: string, rightText: string): DiffResult {
  const dmp = new DiffMatchPatch();

  const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(leftText, rightText);
  const diffs = dmp.diff_main(chars1, chars2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const chunks: DiffChunk[] = [];
  let added = 0;
  let removed = 0;

  for (const [op, text] of diffs) {
    if (op === DIFF_INSERT) {
      chunks.push({ type: "add", text });
      added += text.split("\n").filter((l) => l.trim()).length;
    } else if (op === DIFF_DELETE) {
      chunks.push({ type: "remove", text });
      removed += text.split("\n").filter((l) => l.trim()).length;
    } else if (op === DIFF_EQUAL) {
      chunks.push({ type: "equal", text });
    }
  }

  return {
    chunks,
    summary: { added, removed, changed: Math.min(added, removed) },
  };
}
