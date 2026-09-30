export const tokenize = (input: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuotes = false;
  let inDoubleQuotes = false;
  let isLastCharBackslash = false;

  for (const ch of input.trim()) {
    if (ch === "\\" && !isLastCharBackslash && !inSingleQuotes) {
      isLastCharBackslash = true;
      continue;
    }
    
    if (ch === "\"" && !isLastCharBackslash && !inSingleQuotes) {
      inDoubleQuotes = !inDoubleQuotes;
      continue;
    }

    if (ch === "'" && !inDoubleQuotes && !isLastCharBackslash) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }

    if (ch === " " && !inSingleQuotes && !inDoubleQuotes && !isLastCharBackslash) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;

    isLastCharBackslash = false;
  }

  if (current.length > 0) tokens.push(current);
  return tokens;
}
