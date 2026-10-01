import { createInterface } from "readline";
import { spawnSync, type StdioOptions } from "child_process";
import { findExecutablePath, getFileDescriptorOfFile, isDirectory, parsedPath } from "./utils/directory";
import { checkSpecialRedirectCharactersAndExtractCommandArgs, tokenize } from "./utils/string";
import { closeSync, writeFileSync } from "fs";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

const builtinCommands = ['echo', 'exit', 'type', 'pwd', 'cd'];

rl.prompt();

rl.on('line', (line: string) => {
  const [command, ...args] = tokenize(line);
  const { commandArgs, redirectFile, redirectType } = checkSpecialRedirectCharactersAndExtractCommandArgs(args);

  const isStdoutRedirect = redirectFile && (redirectType === ">" || redirectType === "1>");
  const isStderrRedirect = redirectFile && redirectType === "2>";

  const writeStdout = (text: string) => {
    if (isStdoutRedirect) writeFileSync(redirectFile, `${text}\n`);
    else process.stdout.write(`${text}\n`);
  }

  const writeStderr = (text: string) => {
    if (isStderrRedirect) writeFileSync(redirectFile, `${text}\n`);
    else process.stderr.write(`${text}\n`);
  }

  switch (command) {
    case 'exit':
      rl.close();
      return;

    case 'echo':
      writeStdout(commandArgs.join(' '));
      if (isStderrRedirect) writeFileSync(redirectFile, '');
      break;

    case 'pwd':
      if (redirectFile) {
        writeFileSync(redirectFile, process.cwd() + "\n");
      } else process.stdout.write(process.cwd() + "\n");
      break;

    case 'cd':
      const parsedPathValue = parsedPath(commandArgs.join(' '));
      if (isDirectory(parsedPathValue)) {
        process.chdir(parsedPathValue);
        if (isStderrRedirect) writeFileSync(redirectFile, '');
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
          const fd = getFileDescriptorOfFile(redirectFile);
          const stdio: StdioOptions = (redirectType === '1>' || redirectType === '>')
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
