import constants from "constants";
import { accessSync, openSync, readdirSync } from "fs";
import { delimiter, join } from "path"

export const executablesMatching = (commandPrefix: string): string[] => {
  const paths = (process.env.PATH ?? '').split(delimiter);

  const seen: Record<string, boolean> = {};
  const matches: string[] = [];

  for (const path of paths) {
    let entries: string[];
    
    try {
      entries = readdirSync(path);
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (seen[entry] || !entry.startsWith(commandPrefix)) continue;
      try {
        accessSync(join(path, entry), constants.X_OK);
        matches.push(entry);
        seen[entry] = true;
      } catch {
        // not executable;
      }
    }
  }

  return matches;
}

export const findExecutablePath = (command: string): string | undefined => {
  const paths = (process.env.PATH ?? '').split(delimiter);

  for (const path of paths) {
    const absolutePath = join(path, command);
    try {
      accessSync(absolutePath, constants.X_OK);
      return absolutePath;
    } catch (error) {
      continue;
    }
  }

  return undefined;
}

export const isDirectory = (path: string): boolean => {
  try {
    accessSync(path, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export const parsedPath = (path: string): string => {
  if (path.startsWith('~')) {
    return join(process.env.HOME ?? '', path.slice(1));
  }
  return path;
}

export const getFileDescriptorOfFile = (filePath: string, isAppending: boolean): number => {
  const fd = openSync(filePath, isAppending ? 'a' : 'w');
  return fd;
}
