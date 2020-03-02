import * as core from '@actions/core';
import { loadPackage, updateDependencies, changesToTable } from './package';
import Repository from './repository';

async function run() {
  try {
    const packagePath = core.getInput('packagePath');
    const token = core.getInput('token', { required: true });
    const repo = core.getInput('repo', { required: true });
    const branchPrefix = core.getInput('branchPrefix');
    const include = core.getInput('include').replace(/\s/g, '');
    const exclude = core.getInput('exclude').replace(/\s/g, '');

    core.info(`Checking for updates on ${packagePath} in ${repo}...`);
    core.info(`Using branch prefix: ${branchPrefix}`);
    core.info(`Include: ${include}`);
    core.info(`Exclude: ${exclude}`);

    const content = loadPackage(packagePath);

    const changes = await updateDependencies(content.dependencies, {
      include: include.length ? include.split(',') : [],
      exclude: exclude.length ? exclude.split(',') : []
    });

    if (!changes.size) {
      core.info('No dependency updates found.');
      process.exit(0);
    }

    const [owner, project] = repo.split('/');

    const repository = new Repository(token, owner, project);

    const newBranch = `${branchPrefix}/${new Date().getTime()}`;
    const defaultBranch = await repository.getDefaultBranch();
    const latestCommit = await repository.getLatestCommit(defaultBranch);

    core.debug(`Updating ${defaultBranch}@${latestCommit}...`);

    await repository.createBranch(newBranch, latestCommit);

    const newCommit = await repository.createCommit(
      packagePath,
      content,
      'Update Dependencies',
      latestCommit
    );

    await repository.updateBranch(newBranch, newCommit);

    await repository.createPR(
      newBranch,
      defaultBranch,
      'Update Dependencies',
      changesToTable(changes)
    );

    core.info('Successfully opened a PR to update the dependencies.');
  } catch (err) {
    core.debug(err);
    core.setFailed(`Failed to update dependencies: ${err}`);
  }
}

run();
