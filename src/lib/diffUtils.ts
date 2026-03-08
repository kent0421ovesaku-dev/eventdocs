import DiffMatchPatch from "diff-match-patch";

// diff-match-patch は default export のみのため、クラスをエイリアスして利用
const diff_match_patch = DiffMatchPatch;
const DIFF_DELETE = (DiffMatchPatch as unknown as { DIFF_DELETE?: number }).DIFF_DELETE ?? -1;
const DIFF_INSERT = (DiffMatchPatch as unknown as { DIFF_INSERT?: number }).DIFF_INSERT ?? 1;
const DIFF_EQUAL = (DiffMatchPatch as unknown as { DIFF_EQUAL?: number }).DIFF_EQUAL ?? 0;

export interface DiffChunk {
  type: "add" | "remove" | "equal";
  text: string;
}

export interface DiffGroup {
  id: number;
  added: string[];
  removed: string[];
  context: string[];
}

export interface DiffResult {
  groups: DiffGroup[];
  summary: {
    added: number;
    removed: number;
    totalGroups: number;
  };
}

export function detectTextDiff(leftText: string, rightText: string): DiffResult {
  const dmp = new diff_match_patch();
  const { chars1, chars2, lineArray } = dmp.diff_linesToChars_(leftText, rightText);
  const diffs = dmp.diff_main(chars1, chars2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  dmp.diff_cleanupSemantic(diffs);

  const groups: DiffGroup[] = [];
  let groupId = 0;
  let added = 0;
  let removed = 0;
  let lastEqualLines: string[] = [];
  let currentGroup: DiffGroup | null = null;

  for (const [op, text] of diffs) {
    const lines = text.split("\n").filter((l) => l.trim() !== "");

    if (op === DIFF_EQUAL) {
      if (currentGroup) {
        currentGroup.context = [...currentGroup.context, ...lines.slice(0, 2)];
        groups.push(currentGroup);
        currentGroup = null;
      }
      lastEqualLines = lines.slice(-2);
    } else {
      if (!currentGroup) {
        currentGroup = {
          id: ++groupId,
          added: [],
          removed: [],
          context: [...lastEqualLines],
        };
      }
      if (op === DIFF_INSERT) {
        currentGroup.added.push(...lines);
        added += lines.length;
      } else {
        currentGroup.removed.push(...lines);
        removed += lines.length;
      }
    }
  }

  if (currentGroup) {
    groups.push(currentGroup);
  }

  return {
    groups,
    summary: { added, removed, totalGroups: groups.length },
  };
}
