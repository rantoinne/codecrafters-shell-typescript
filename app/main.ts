import { createInterface } from "readline";
import { spawnSync, type StdioOptions } from "child_process";
import { executablesMatching, findExecutablePath, getFileDescriptorOfFile, isDirectory, parsedPath } from "./utils/directory";
import { checkSpecialRedirectCharactersAndExtractCommandArgs, longestCommonPrefix, tokenize } from "./utils/string";
import { closeSync, readdirSync, writeFileSync } from "fs";
import { basename, dirname, join } from "path";

const builtinCommands = ['echo', 'exit', 'type', 'pwd', 'cd'];

let tabPressedCount = 0;

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: (line: string) => {
    const [_, ...args] = tokenize(line);

    if (!args.length) {
      const matches = (
        [
          ...new Set([
            ...builtinCommands.filter(cmd => cmd.startsWith(line)),
            ...executablesMatching(line),
          ])
        ]
      )?.sort().map(match => match + ' ');
  
      if (!matches.length) {
        process.stdout.write("\x07");
        return [[], line];
      }
      
      if (matches.length === 1) {
        tabPressedCount = 0;
        return [matches, line]; // no manual print
      }
  
      const lcp = longestCommonPrefix(matches);
  
      if (lcp.length > line.length) {
        tabPressedCount = 0;
        return [[lcp], line]; // no trailing space
      }
      
      if (tabPressedCount === 0) {
        tabPressedCount++;
        process.stdout.write("\x07");
        return [[], line];
      }
      
      tabPressedCount = 0;
      process.stdout.write(`\n${matches.join("  ")}\n$ ${line}`);
      return [[], line];
    } else {
      const lastArg = args[args.length - 1] ?? "";
      let dir: string;
      let prefix: string;

      if (lastArg.endsWith("/")) {
        dir = lastArg;
        prefix = "";
      } else if (lastArg.includes("/")) {
        dir = dirname(lastArg);
        prefix = basename(lastArg);
      } else {
        dir = ".";
        prefix = lastArg;
      }
      let matches: string[];
      try {
        matches = readdirSync(join(process.cwd(), dir), { withFileTypes: true })
          .filter((e) => e.name.startsWith(prefix))
          .map((e) => {
            const completed =
              dir === "." ? e.name : join(dir, e.name); // "pac..." → "package.json", not "pac/package.json"
            // dir → trailing / so next Tab can continue; file → trailing space
            return e.isDirectory() ? completed + "/" : completed + " ";
          })
          .sort();
      } catch {
        process.stdout.write("\x07");
        return [[], lastArg];
      }
      if (!matches.length) {
        process.stdout.write("\x07");
        return [[], lastArg];
      }
      if (matches.length === 1) {
        tabPressedCount = 0;
        // 2nd value MUST be lastArg so readline replaces only the last word
        return [matches, lastArg];
      }
      const lcp = longestCommonPrefix(matches);
      // Compare against lastArg (not full line)
      if (lcp.length > lastArg.length) {
        tabPressedCount = 0;
        // strip trailing space from LCP if it's only there because every match had " "
        // (optional: compute LCP on names before adding " " / "/")
        return [[lcp.endsWith(" ") ? lcp.slice(0, -1) : lcp], lastArg];
      }
      if (tabPressedCount === 0) {
        tabPressedCount++;
        process.stdout.write("\x07");
        return [[], lastArg];
      }
      tabPressedCount = 0;
      // show basenames (or full last-arg forms) then redraw prompt + full line
      process.stdout.write(`\n${matches.join("  ")}\n$ ${line}`);
      return [[], lastArg];
    }
  }
});

rl.prompt();

rl.on('line', (line: string) => {
  const [command, ...args] = tokenize(line);
  const { commandArgs, redirectFile, redirectType } = checkSpecialRedirectCharactersAndExtractCommandArgs(args);

  const isStdoutRedirect = redirectFile && [">", "1>", ">>", "1>>"].includes(redirectType);
  const isStderrRedirect = redirectFile && ["2>", "2>>"].includes(redirectType);
  const isAppending = Boolean(redirectFile && redirectType.endsWith('>>'));

  const writeStdout = (text: string) => {
    if (isStdoutRedirect) writeFileSync(redirectFile, `${text}\n`, { flag: isAppending ? 'a' : 'w' });
    else process.stdout.write(`${text}\n`);
  }

  const writeStderr = (text: string) => {
    if (isStderrRedirect) writeFileSync(redirectFile, `${text}\n`, { flag: isAppending ? 'a' : 'w' });
    else process.stderr.write(`${text}\n`);
  }

  switch (command) {
    case 'exit':
      rl.close();
      return;

    case 'echo':
      writeStdout(commandArgs.join(' '));
      if (isStderrRedirect) writeFileSync(redirectFile, '', { flag: isAppending ? 'a' : 'w' });
      break;

    case 'pwd':
      if (redirectFile) {
        writeFileSync(redirectFile, process.cwd() + "\n", { flag: isAppending ? 'a' : 'w' });
      } else process.stdout.write(process.cwd() + "\n");
      break;

    case 'cd':
      const parsedPathValue = parsedPath(commandArgs.join(' '));
      if (isDirectory(parsedPathValue)) {
        process.chdir(parsedPathValue);
        if (isStderrRedirect) writeFileSync(redirectFile, '', { flag: isAppending ? 'a' : 'w' });
      } else {
        writeStderr(`${command}: ${commandArgs}: No such file or directory`);
      }
      break;

    case 'type':
      if (builtinCommands.includes(commandArgs.join(' '))) {
        writeStdout(`${commandArgs} is a shell builtin`);
      } else if(!commandArgs) {
        writeStderr('type: missing operand');
      } else {
        const executablePath = findExecutablePath(commandArgs.join(' '))
        if (executablePath) {
          writeStdout(`${commandArgs} is ${executablePath}`);
        } else {
          writeStderr(`${commandArgs}: not found`);
        }
      }
      break;

    default:
      const executablePath = findExecutablePath(command);
      if (executablePath) {
        if (redirectFile) {
          const fd = getFileDescriptorOfFile(redirectFile, isAppending);
          const stdio: StdioOptions = isStdoutRedirect
            ? ['inherit', fd, 'inherit'] : ['inherit', 'inherit', fd];

          spawnSync(executablePath, commandArgs, { stdio, argv0: command });
          closeSync(fd);
        } else {
          spawnSync(executablePath, commandArgs, { stdio: 'inherit', argv0: command });
        }
      } else {
        console.log(`${command}: command not found`);
      }
  }  

  rl.prompt();
})
