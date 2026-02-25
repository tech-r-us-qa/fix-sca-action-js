const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('@actions/core');
const exec = require('@actions/exec');
const Extract = require('extract-zip');

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
    const cliZipPath = path.join(actionPath, 'cli', 'veracode.zip');
    const veracodeCLIDir = path.join(os.homedir(), 'veracode-cli-2');

    if (!fs.existsSync(veracodeCLIDir)) {
      fs.mkdirSync(veracodeCLIDir, { recursive: true });
    }

    core.info(`Extracting Veracode CLI from ${cliZipPath} to ${veracodeCLIDir}`);
    await Extract({ file: cliZipPath, dir: veracodeCLIDir });

    // Make veracode CLI executable
    const veracodeBinary = path.join(veracodeCLIDir, 'veracode');
    fs.chmodSync(veracodeBinary, 0o755);

    core.info('Veracode CLI setup completed successfully');
  } catch (error) {
    throw new Error(`Failed to setup Veracode CLI: ${error.message}`);
  }
}

module.exports = setupCli;
