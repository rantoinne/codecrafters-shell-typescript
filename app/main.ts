import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

rl.prompt();

rl.on('line', (line: string) => {
  const parsedLine = line.trim();

  if (parsedLine === 'exit') {
    rl.close();
    return;
  }

  if (parsedLine.startsWith('echo')) {
    const message = parsedLine.split(' ').slice(1).join(' ');
    console.log(message);
    rl.prompt();
    return;
  }

  if (parsedLine.startsWith('type')) {
    const command = parsedLine.split(' ').slice(1).join(' ');
    if (['echo', 'exit', 'type'].includes(command)) {
      console.log(`${command} is a shell builtin`);
    }
    else if (!command) {
      console.log('type: missing operand');
    }
    else {
      console.log(`${command}: not found`);
    }
    rl.prompt();
    return;
  }
  
  console.log(`${line}: command not found`);
  rl.prompt();
})
