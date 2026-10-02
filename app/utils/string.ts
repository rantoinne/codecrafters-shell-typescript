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

export const checkSpecialRedirectCharactersAndExtractCommandArgs = (args: string[]): { commandArgs: string[], redirectFile: string, redirectType: string } => {
  const redirectCharacters = ['>', '1>', '2>', '>>', '1>>', '2>>'];

  const index = args.findIndex(arg => redirectCharacters.includes(arg));
  
  if (index > -1) {
    if (args[index + 1]?.length > 0) {
      return {
        commandArgs: args.slice(0, index),
        redirectFile: args[index + 1],
        redirectType: args[index],
      } 
    }
  }

  return {
    commandArgs: args,
    redirectFile: '',
    redirectType: '',
  };
}
