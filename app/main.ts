import which from "which";
import { createInterface } from "readline";
import { execSync } from "child_process";

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
        const executablePath = which.sync(args, { nothrow: true, delimiter: ':' });
        if (executablePath) {
          console.log(`${args} is ${executablePath}`);
        } else {
          console.log(`${args}: not found`);
        }
      }
      break;

    default:
      const executablePath = which.sync(command, { nothrow: true, delimiter: ':' });
      if (executablePath) {
        execSync(line, { stdio: 'inherit' });
      } else {
        console.log(`${command}: command not found`);
      }
  }  

  rl.prompt();
})
