export const tokenize = (input: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuotes = false;

  for (const ch of input.trim()) {
    if (ch === "'") {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }

    if (ch === " " && !inSingleQuotes) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) tokens.push(current);
  return tokens;
}

export const stringHasQuote = (str: string): boolean => {
  return str.includes("'");
};

// echo 'hello   world'   hello
// hello   worldhello
// cat '/tmp/f   81' '/tmp/f   43' '/tmp/f   40'