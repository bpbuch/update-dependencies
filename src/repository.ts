import * as core from '@actions/core';
import * as github from '@actions/github';

export default class Repository {
  octokit: github.GitHub;
  owner: string;
  repo: string;

  constructor(token: string, owner: string, repo: string) {
    this.octokit = new github.GitHub(token);
    this.owner = owner;
    this.repo = repo;
  }

  async getDefaultBranch() {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      } as any);

      return response.data.default_branch;
    } catch (err) {
      core.debug(err);
      throw 'Error getting the default branch';
    }
  }

  async getLatestCommit(branch: string) {
    try {
      const response = await this.octokit.git.getRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`
      } as any);

      return response.data.object.sha;
    } catch (err) {
      core.debug(err);
      throw 'Error getting the latest commit';
    }
  }

  async createBranch(branch: string, base: string) {
    try {
      await this.octokit.git.createRef({
        owner: this.owner,
        repo: this.repo,
        ref: `refs/heads/${branch}`,
        sha: base
      } as any);
    } catch (err) {
      core.debug(err);
      throw 'Error creating the new branch';
    }
  }

  async createCommit(
    path: string,
    content: any,
    message: string,
    parent: string
  ) {
    let blobSha;
    try {
      const response = await this.octokit.git.createBlob({
        owner: this.owner,
        repo: this.repo,
        content: Buffer.from(JSON.stringify(content, null, 2)).toString(
          'base64'
        ),
        encoding: 'base64'
      } as any);

      blobSha = response.data.sha;
    } catch (err) {
      core.debug(err);
      throw 'Error creating the commit blob';
    }

    let treeSha;
    try {
      const response = await this.octokit.git.createTree({
        owner: this.owner,
        repo: this.repo,
        tree: [
          {
            path: path,
            mode: '100644',
            type: 'blob',
            sha: blobSha
          }
        ],
        base_tree: parent
      } as any);

      treeSha = response.data.sha;
    } catch (err) {
      core.debug(err);
      throw 'Error creating the commit tree';
    }

    try {
      const response = await this.octokit.git.createCommit({
        owner: this.owner,
        repo: this.repo,
        message,
        tree: treeSha,
        parents: [parent],
        author: {
          name: 'github-actions',
          email: 'actions@github.com'
        }
      } as any);

      return response.data.sha;
    } catch (err) {
      core.debug(err);
      throw 'Error creating the commit';
    }
  }

  async updateBranch(branch: string, commit: string) {
    try {
      await this.octokit.git.updateRef({
        owner: this.owner,
        repo: this.repo,
        ref: `heads/${branch}`,
        sha: commit
      } as any);
    } catch (err) {
      core.debug(err);
      throw 'Error updating the branch';
    }
  }

  async createPR(head: string, base: string, title: string, body: string) {
    try {
      await this.octokit.pulls.create({
        owner: this.owner,
        repo: this.repo,
        title: title,
        head: head,
        base: base,
        body: body
      } as any);
    } catch (err) {
      core.debug(err);
      throw 'Error creating the pull request';
    }
  }
}
