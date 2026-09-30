import { createInterface } from "readline";
import { spawnSync } from "child_process";
import { findExecutablePath, isDirectory, parsedPath } from "./utils/directory";
import { tokenize } from "./utils/string";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

const builtinCommands = ['echo', 'exit', 'type', 'pwd', 'cd'];

rl.prompt();

rl.on('line', (line: string) => {
  const [command, ...args] = tokenize(line);

  switch (command) {
    case 'exit':
      rl.close();
      return;

    case 'echo':
      console.log(args.join(' '));
      break;

    case 'pwd':
      console.log(process.cwd());
      break;

    case 'cd':
      const parsedPathValue = parsedPath(args.join(' '));
      if (isDirectory(parsedPathValue)) {
        process.chdir(parsedPathValue);
      } else {
        console.log(`${command}: ${args}: No such file or directory`);
      }
      break;

    case 'type':
      if (builtinCommands.includes(args.join(' '))) {
        console.log(`${args} is a shell builtin`);
      } else if(!args) {
        console.log('type: missing operand');
      } else {
        const executablePath = findExecutablePath(args.join(' '))
        if (executablePath) {
          console.log(`${args} is ${executablePath}`);
        } else {
          console.log(`${args}: not found`);
        }
      }
      break;

    default:
      const executablePath = findExecutablePath(command);
      if (executablePath) {
        spawnSync(executablePath, args, { stdio: 'inherit', argv0: command });
      } else {
        console.log(`${command}: command not found`);
      }
  }  

  rl.prompt();
})
