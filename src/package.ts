import * as fs from 'fs';
import * as core from '@actions/core';
import * as npmFetch from 'npm-registry-fetch';
import * as semver from 'semver';

function loadPackage(path: string) {
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
        const res: any = await npmFetch.json(`/${dependency}`);

        return res['dist-tags'].latest;
    } catch (err) {
        core.debug(err);
        throw `Error getting latest version for ${dependency}`;
    }
}

async function updateDependencies(dependencies: string[]) {
    let wasUpdated = false;

    for (const dependency in dependencies) {
        const latest = await getLatestVersion(dependency);

        const current = dependencies[dependency];

        if (semver.satisfies(latest, current)) {
            continue;
        }

        let newVersion = '';

        if (isNaN(current.charAt(0) as any)) {
            newVersion += current.charAt(0);
        }

        newVersion += latest;

        core.debug(`Updating ${dependency} from ${current} to ${newVersion}`);

        dependencies[dependency] = newVersion;

        wasUpdated = true;
    }

    return wasUpdated;
}

export {
    loadPackage,
    updateDependencies
};
