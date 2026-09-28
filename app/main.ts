import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "$ ",
});

rl.prompt();

rl.on('line', (line: string) => {
  if (line.trim() === 'exit') {
    rl.close();
    return;
  }

  if (line.trim().startsWith('echo')) {
    const message = line.trim().split(' ').slice(1).join(' ');
    console.log(message);
    rl.prompt();
    return;
  }
  
  console.log(`${line}: command not found`);
  rl.prompt();
})
