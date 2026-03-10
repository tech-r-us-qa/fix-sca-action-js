const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('@actions/core');
const exec = require('@actions/exec');
const glob = require('glob');

async function setupCli(actionPath, vid, vkey, workspaceDir) {
  try {
    // Create .veracode directory
    const veracodeDir = path.join(os.homedir(), '.veracode');
    if (!fs.existsSync(veracodeDir)) {
      fs.mkdirSync(veracodeDir, { recursive: true });
    }

    // Create veracode.yml configuration file
    const configPath = path.join(veracodeDir, 'veracode.yml');
    const configContent = `api:
    key-id: ${vid}
    key-secret: ${vkey}
oauth:
    enabled: false
    region: ""
packager:
    "":
        trust: true
    _users_someusers_project:
        trust: true
`;

    fs.writeFileSync(configPath, configContent);
    core.info(`Created Veracode configuration at ${configPath}`);

    // Extract Veracode CLI
    // Find the veracode-cli tar.gz file (version may vary)
    // The file is checked out to veracode-helper directory via GitHub action
    const cliPattern = path.join(workspaceDir, 'veracode-helper', 'veracode-cli_*.tar.gz');
    const cliFiles = glob.sync(cliPattern);

    if (cliFiles.length === 0) {
      throw new Error(`No veracode-cli tar.gz file found matching pattern: ${cliPattern}`);
    }

    const cliTarPath = cliFiles[0];
    const veracodeCLIDir = path.join(os.homedir(), 'veracode-cli-2');

    if (!fs.existsSync(veracodeCLIDir)) {
      fs.mkdirSync(veracodeCLIDir, { recursive: true });
    }

    core.info(`Extracting Veracode CLI from ${cliTarPath} to ${veracodeCLIDir}`);
    await exec.exec('tar', ['-xzf', cliTarPath, '-C', veracodeCLIDir]);

    // Make veracode CLI executable
    const veracodeBinary = path.join(veracodeCLIDir, 'veracode');
    fs.chmodSync(veracodeBinary, 0o755);

    core.info('Veracode CLI setup completed successfully');
  } catch (error) {
    throw new Error(`Failed to setup Veracode CLI: ${error.message}`);
  }
}

module.exports = setupCli;
