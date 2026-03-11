const fs = require('fs');
const path = require('path');
const os = require('os');
const core = require('@actions/core');

async function setupCli(vid, vkey) {
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

    core.info('Veracode CLI setup completed successfully');
  } catch (error) {
    throw new Error(`Failed to setup Veracode CLI: ${error.message}`);
  }
}

module.exports = setupCli;
