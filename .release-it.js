module.exports ={
  "git": {
    "commitMessage": "chore: release v${version}",
    "tagName": "${version}",
    "push": true
  },
  "github": {
    "release": true
  },
  "npm": {
    "publish": false
  },
  "plugins": {
    '@release-it/conventional-changelog': {
      infile: 'CHANGELOG.md',
      gitRawCommitsOpts: {
        'full-history': true,
        'no-merges': true,
      }
    },
  },
}
