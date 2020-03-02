import * as fs from 'fs';
import * as core from '@actions/core';
import * as npmFetch from 'npm-registry-fetch';
import * as semver from 'semver';

interface UpdateOptions {
  include: string[];
  exclude: string[];
}

export function loadPackage(path: string) {
  try {
    const content = fs.readFileSync(path, 'utf8');

    return JSON.parse(content);
  } catch (err) {
    core.debug(err);
    throw 'Error parsing the package file';
  }
}

async function getLatestVersion(dependency: string) {
  try {
    const res: any = await npmFetch.json(`/${dependency}`).catch(err => {
      throw err;
    });

    if (!res.hasOwnProperty('dist-tags')) {
      throw `Unexpected payload while getting latest version for ${dependency}`;
    }

    return res['dist-tags'].latest;
  } catch (err) {
    core.debug(err);
    throw `Error getting latest version for ${dependency}`;
  }
}

export async function updateDependencies(
  dependencies: string[],
  options: UpdateOptions
) {
  try {
    let changes = new Map() as Map<string, string[]>;

    for (const dependency in dependencies) {
      if (options.include.length && !options.include.includes(dependency)) {
        core.debug(`Skipping ${dependency}: Not found in include`);
        continue;
      }

      if (options.exclude.length && options.exclude.includes(dependency)) {
        core.debug(`Skipping ${dependency}: Found in exclude`);
        continue;
      }

      const latestVersion = await getLatestVersion(dependency);

      const currentVersion = dependencies[dependency];

      if (semver.satisfies(latestVersion, currentVersion)) {
        continue;
      }

      let newVersion = '';

      if (isNaN(currentVersion.charAt(0) as any)) {
        newVersion += currentVersion.charAt(0);
      }

      newVersion += latestVersion;

      core.debug(
        `Updating ${dependency} from ${currentVersion} to ${newVersion}`
      );

      dependencies[dependency] = newVersion;

      changes.set(dependency, [currentVersion, newVersion]);
    }

    return changes;
  } catch (err) {
    throw err;
  }
}

export function changesToTable(changes: Map<string, string[]>) {
  let table =
    '| Dependency | Current Version | New Version |\n| ---- | ---- | ----|\n';

  changes.forEach((value, key) => {
    table += `| ${key} | ${value[0]}| ${value[1]} |\n`;
  });

  return table;
}
