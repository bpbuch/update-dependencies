# Update Dependencies

GitHub Action for staying up to date on the latest npm dependencies

# Configurations

| Input | Description | Required | Default |
| ----- | ----------- | :------: | :-----: |
| token | GitHub auth token (ex. `${{ secrets.GITHUB_TOKEN }}`) | :white_check_mark: | |
| repo | The name of the owner and repository (ex. `octocat/Hello-World`)| :white_check_mark: | |
| packagePath | A relative path to a single package.json file | :x: | `package.json` |
| branchPrefix | The branch name prefix for the pull request | :x: | `update` |

# Sample Workflows

## Single Module

```yaml
name: Update Dependencies
on:
  schedule:
    - cron: '00 0 * * *'
jobs:
  check-language-servers:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: update-dependencies
      uses: bpbuch/update-dependencies@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        repo: ${{ github.repository }}
```

## Multiple Modules

```yaml
name: Update Dependencies
on:
  schedule:
    - cron: '00 0 * * *'
jobs:
  check-language-servers:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        module:
        - first-module
        - second-module
    steps:
    - uses: actions/checkout@master
    - name: update-dependencies
      uses: bpbuch/update-dependencies@master
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        repo: ${{ github.repository }}
        packagePath: packages/${{ matrix.module }}/package.json
        branchPrefix: ${{ matrix.module }}
```