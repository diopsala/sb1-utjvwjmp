import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

function initGitIfNeeded() {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (error) {
    console.log('Initializing Git repository...');
    execSync('git init');
  }
}

function setupGitRemote(repoUrl) {
  try {
    // Check if remote already exists
    try {
      execSync('git remote get-url origin', { stdio: 'ignore' });
    } catch {
      // If remote doesn't exist, add it
      console.log('Adding GitHub remote...');
      execSync(`git remote add origin ${repoUrl}`);
    }
  } catch (error) {
    console.error('Error setting up remote:', error.message);
    process.exit(1);
  }
}

function createSnapshot(message, repoUrl) {
  try {
    // Initialize Git if needed
    initGitIfNeeded();

    // Setup remote if URL is provided
    if (repoUrl) {
      setupGitRemote(repoUrl);
    }

    // Read current version from package.json
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    const version = packageJson.version;

    // Create a tag with the current version and message
    const tagName = `v${version}-${Date.now()}`;
    
    // Add all changes
    execSync('git add .');
    
    // Commit changes
    execSync(`git commit -m "${message || 'Snapshot created'}"`, { stdio: 'inherit' });
    
    // Create tag
    execSync(`git tag -a ${tagName} -m "${message || 'Snapshot created'}"`, { stdio: 'inherit' });

    // Push to GitHub if remote is set
    try {
      console.log('\nPushing to GitHub...');
      execSync('git push origin main --tags', { stdio: 'inherit' });
      console.log('Successfully pushed to GitHub!');
    } catch (pushError) {
      if (pushError.message.includes('remote origin already exists')) {
        console.log('Remote already exists, updating...');
        execSync('git remote set-url origin ' + repoUrl);
        execSync('git push origin main --tags', { stdio: 'inherit' });
      } else {
        throw pushError;
      }
    }

    console.log(`\nSnapshot created successfully:`);
    console.log(`Tag: ${tagName}`);
    console.log(`Message: ${message || 'Snapshot created'}`);
    console.log(`Version: ${version}`);
  } catch (error) {
    console.error('Error creating snapshot:', error.message);
    process.exit(1);
  }
}

// Get arguments from command line
const message = process.argv[2] || 'Snapshot created';
const repoUrl = process.argv[3]; // Optional GitHub repository URL

if (!repoUrl) {
  console.log('Usage: npm run snapshot "Commit message" "https://github.com/username/repo.git"');
  console.log('No GitHub URL provided, creating local snapshot only...');
}

createSnapshot(message, repoUrl);