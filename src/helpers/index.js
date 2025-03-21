const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const settings = require('../../settings');
const { readFileSync, existsSync } = require('fs');
const { execSync } = require('child_process');

const NoAlacrittyFileFoundError = new Error(
  'No Alacritty configuration file found.\nExpected one of the following files to exist:\n' +
    possibleLocations().join('\n') +
    '\nOr you can create a new one using `alacritty-themes --create`'
);

function createBackup() {
  if (!alacrittyFileExists()) {
    return;
  }

  const alacrittyFile = alacrittyConfigPath();
  const backupFile = `${alacrittyFile}.${Date.now()}.bak`;

  fsPromises
    .copyFile(alacrittyFile, backupFile)
    .then(() => {
      console.log(`Automatic backup file was created: ${backupFile}`);
    })
    .catch((err) => {
      if (err) throw err;
    });
}

function rootDirectory() {
  return settings.PROJECT_DIR;
}

function existingTheme(themeName, themesFolder) {
  const file = themeFilePath(themeName, themesFolder);

  return fs.existsSync(file);
}

function themeFilePath(themeName, themesFolder) {
  return path.join(themesFolder, `${themeName}.toml`);
}

function themesFolder() {
  return path.join(rootDirectory(), 'themes');
}

function isWindows() {
  return process.env.OS === 'Windows_NT';
}

function isWsl() {
  try {
    if (existsSync('/proc/sys/kernel/osrelease')) {
      const osRelease = readFileSync(
        '/proc/sys/kernel/osrelease',
        'utf8'
      ).toLowerCase();
      if (osRelease.includes('microsoft')) {
        return true;
      }
    }
    if (process.env.WSLENV !== undefined) {
      return true;
    }
    const uname = execSync('uname -r', {
      encoding: 'utf8',
      stdio: 'pipe',
    }).toLowerCase();

    if (uname.includes('microsoft')) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

function windowsHome() {
  return process.env.APPDATA;
}

function linuxHome() {
  return process.env.HOME;
}

function archHome() {
  return process.env.XDG_CONFIG_HOME;
}

function pathToAlacrittyFile() {
  return isWindows()
    ? pathToAlacrittyFileOnWindows()
    : pathToAlacrittyFileOnLinux();
}

function pathToAlacrittyFileOnWindows() {
  return path.join(windowsHome(), 'alacritty/');
}

function pathToAlacrittyFileOnLinux() {
  return path.join(linuxHome(), '.config/alacritty/');
}

function alacrittyTemplatePath() {
  return path.join(rootDirectory(), 'alacritty.toml');
}

function alacrittyFileExists() {
  return possibleLocations().some(function (location) {
    return fs.existsSync(location);
  });
}

function alacrittyConfigPath() {
  return possibleLocations().find(function (location) {
    if (!fs.existsSync(location)) return;

    return location;
  });
}

function possibleLocations() {
  let locations = [];

  if (linuxHome()) {
    locations.push(
      path.join(linuxHome(), '.config/alacritty/alacritty.toml'),
      path.join(linuxHome(), '.alacritty.toml')
    );
  }

  if (isWindows() || isWsl()) {
    locations.push(path.join(windowsHome(), 'alacritty/alacritty.toml'));
  }

  // locations where the alacritty config can be located according to
  // https://github.com/alacritty/alacritty#configuration
  if (archHome()) {
    locations.push(
      path.join(archHome(), 'alacritty/alacritty.toml'),
      path.join(archHome(), 'alacritty.toml')
    );
  }

  return locations;
}

function helpMessage() {
  return `
    Usage: \n\talacritty-themes [options] [theme-name] | [themes-directory]\n

    Description: \n\tThemes candy for alacritty A cross-platform GPU-accelerated terminal emulator\n

    Options: \n\t--help, -h\tshows this help message and exit
    \t--create, -C\tcreates a new config file
    \t--current, -c\tshows applied theme name
    \t--list, -l\tlists all available themes
    \t--directory, -d\tspecify themes directory
  `;
}

module.exports = {
  NoAlacrittyFileFoundError,
  alacrittyConfigPath,
  alacrittyFileExists,
  alacrittyTemplatePath,
  archHome,
  createBackup,
  helpMessage,
  isWindows,
  linuxHome,
  pathToAlacrittyFile,
  possibleLocations,
  rootDirectory,
  existingTheme,
  themeFilePath,
  themesFolder,
  windowsHome,
  isWsl,
};
