import * as core from '@actions/core';
import { loadPackage, updateDependencies, changesToTable } from './package';
import Repository from './repository';

async function run() {
  try {
    const packagePath = core.getInput('packagePath');
    const token = core.getInput('token', { required: true });
    const repo = core.getInput('repo', { required: true });
    const branchPrefix = core.getInput('branchPrefix');

    core.info(`Checking for updates on ${packagePath}...`);

    const content = loadPackage(packagePath);

    const changes = await updateDependencies(content.dependencies);

    if (!changes.size) {
      core.info('No dependency updates found.');
      process.exit(0);
    }

    const [owner, project] = repo.split('/');

    const repository = new Repository(token, owner, project);

    const newBranch = `${branchPrefix}/${new Date().getTime()}`;
    const defaultBranch = await repository.getDefaultBranch();
    const latestCommit = await repository.getLatestCommit(defaultBranch);

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
    core.error(`Failed to update dependencies: ${err}`);
    process.exit(1);
  }
}

run();
