import { createInterface } from "readline";
import { spawnSync } from "child_process";
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
  const { commandArgs, redirectFile } = checkSpecialRedirectCharactersAndExtractCommandArgs(args);

  switch (command) {
    case 'exit':
      rl.close();
      return;

    case 'echo':
      if (redirectFile) {
        writeFileSync(redirectFile, commandArgs.join(' ') + "\n");
      } else process.stdout.write(commandArgs.join(' ') + "\n");
      break;

    case 'pwd':
      if (redirectFile) {
        writeFileSync(redirectFile, process.cwd() + "\n");
      } else process.stdout.write(process.cwd() + "\n");
      break;

    case 'cd':
      const parsedPathValue = parsedPath(commandArgs.join(' '));
      if (isDirectory(parsedPathValue)) {
        if (redirectFile) {
          writeFileSync(redirectFile, '');
        } else process.chdir(parsedPathValue);
      } else {
        console.log(`${command}: ${commandArgs}: No such file or directory`);
      }
      break;

    case 'type':
      if (builtinCommands.includes(commandArgs.join(' '))) {
        console.log(`${commandArgs} is a shell builtin`);
      } else if(!commandArgs) {
        console.log('type: missing operand');
      } else {
        const executablePath = findExecutablePath(commandArgs.join(' '))
        if (executablePath) {
          console.log(`${commandArgs} is ${executablePath}`);
        } else {
          console.log(`${commandArgs}: not found`);
        }
      }
      break;

    default:
      const executablePath = findExecutablePath(command);
      if (executablePath) {
        if (redirectFile) {
          const fd = getFileDescriptorOfFile(redirectFile);
          spawnSync(executablePath, commandArgs, { stdio: ['inherit', fd, 'inherit'], argv0: command });
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
