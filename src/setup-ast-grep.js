const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('@actions/core');
const Extract = require('extract-zip');

async function setupAstGrep(actionPath) {
  try {
    const isWindows = process.platform === 'win32';
    
    // Determine extraction directory based on platform
    let extractDir;
    let binaryName;
    let binaryPath;
    let fileName;

    if (isWindows) {
      // For Windows, extract to a temp directory and add to PATH via core.addPath
      extractDir = path.join(os.tmpdir(), 'ast-grep');
      binaryName = 'ast-grep.exe';
      binaryPath = path.join(extractDir, binaryName);
      fileName = 'app-x86_64-pc-windows-msvc.zip';
    } else {
      // For Linux systems
      extractDir = '/usr/local/bin';
      binaryName = 'ast-grep';
      binaryPath = path.join(extractDir, binaryName);
      fileName = 'app-x86_64-unknown-linux-gnu.zip';
    }

    const astGrepVersion = '0.41.0';
    const astGrepZipPath = path.join(actionPath, 'ast-grep', `${astGrepVersion}` ,`${fileName}`);

    if (!fs.existsSync(astGrepZipPath)) {
      throw new Error(`ast-grep v${astGrepVersion} zip file not found at ${astGrepZipPath}`);
    }

    core.info(`Extracting ast-grep v${astGrepVersion} from ${astGrepZipPath} to ${extractDir}`);
    
    // Create extraction directory if it doesn't exist
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }

    // Extract ast-grep binary
    await Extract({
      file: astGrepZipPath,
      dir: extractDir,
      onEntry: (entry) => {
        // Only extract ast-grep binary (with or without .exe extension)
        const fileName = entry.fileName.toLowerCase();
        if (fileName === binaryName || 
            fileName.endsWith(`/${binaryName}`) || 
            fileName.endsWith(`\\${binaryName}`)) {
          return true;
        }
        return false;
      }
    });

    // Verify binary exists after extraction
    if (fs.existsSync(binaryPath)) {
      // On Unix-like systems, make the binary executable
      if (!isWindows) {
        fs.chmodSync(binaryPath, 0o755);
        core.info(`ast-grep v${astGrepVersion} setup completed successfully`);
        core.info(`Binary location: ${binaryPath}`);
      } else {
        // On Windows, add the extraction directory to PATH
        core.addPath(extractDir);
        core.info(`ast-grep v${astGrepVersion} setup completed successfully (Windows)`);
        core.info(`Binary location: ${binaryPath}`);
        core.info(`Added ${extractDir} to PATH`);
      }
    } else {
      throw new Error(`ast-grep binary (${binaryName}) not found at ${binaryPath} after extraction`);
    }
  } catch (error) {
    throw new Error(`Failed to setup ast-grep: ${error.message}`);
  }
}

module.exports = setupAstGrep;
