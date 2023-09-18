## 0.6.2
* update @actions/core package to 1.10.0

## 0.6.1
* Fix adding outputs if action failed

## 0.6.0
* Add `jira-issue-found` and `jira-issue-source` outputs https://github.com/cakeinpanic/jira-description-action/pull/45

## 0.5.1
* Improve error logging if Jira request fails

## 0.5.0
* Allow using action not only in organization https://github.com/cakeinpanic/jira-description-action/pull/36
* Improve JIRA error output(get rid of circular dependency log) https://github.com/cakeinpanic/jira-description-action/pull/43 

## 0.4.0
* Use node 16+ https://github.com/cakeinpanic/jira-description-action/pull/27

## 0.3.1
* Don't fail if PR body is empty fixing https://github.com/cakeinpanic/jira-description-action/issues/17

## 0.3.0
* Add `fail-when-jira-issue-not-found` input

## 0.2.0
* Replace `use-branch-name` with `use`

## 0.1.2
* Add regexp groups support
* Allow usage without project name

## 0.1.1
* Don't make user to base64 encode his token manually
* Remove auto-build of action itself for tags and fix target branch for non-master branches

## 0.1.0
* Release first version
