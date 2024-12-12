const { execSync } = require('child_process');

// Function to execute shell commands
function execCommand(command) {
  execSync(command, { stdio: 'inherit' });
}

// Build the Next.js application
execCommand('npm run build');

// Start the Next.js application
execCommand('npm start');
