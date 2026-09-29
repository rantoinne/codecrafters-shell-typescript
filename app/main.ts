import { createInterface } from "readline";
import { spawnSync } from "child_process";
import { findExecutablePath } from "./utils/directory";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

const builtinCommands = ['echo', 'exit', 'type', 'pwd'];

rl.prompt();

rl.on('line', (line: string) => {
  const parsedLine = line.trim();
  const command = parsedLine.split(' ')[0];
  const args = parsedLine.split(' ').slice(1).join(' ');

  switch (command) {
    case 'exit':
      rl.close();
      return;

    case 'echo':
      console.log(args);
      break;

      case 'pwd':
        console.log(process.cwd());
        break;

    case 'type':
      if (builtinCommands.includes(args)) {
        console.log(`${args} is a shell builtin`);
      } else if(!args) {
        console.log('type: missing operand');
      } else {

        const executablePath = findExecutablePath(args)
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
        spawnSync(line, { stdio: 'inherit' });
      } else {
        console.log(`${command}: command not found`);
      }
  }  

  rl.prompt();
})
