import constants from "constants";
import { accessSync } from "fs";
import { delimiter, join } from "path"

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