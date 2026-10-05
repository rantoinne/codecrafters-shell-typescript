import { createInterface } from "readline";
import { spawnSync, type StdioOptions } from "child_process";
import { findExecutablePath, getFileDescriptorOfFile, isDirectory, parsedPath } from "./utils/directory";
import { checkSpecialRedirectCharactersAndExtractCommandArgs, tokenize } from "./utils/string";
import { closeSync, writeFileSync } from "fs";

const builtinCommands = ['echo', 'exit', 'type', 'pwd', 'cd'];

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
  completer: (line: string) => {
    let completions = (
      builtinCommands.filter(command => command.startsWith(line))
    )?.map(c => c + ' ');

    if (!completions.length) {
      process.stdout.write('\x07');
    }

    // console.log({completions});

    return [completions, line];
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
