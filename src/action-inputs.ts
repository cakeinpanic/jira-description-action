import * as core from '@actions/core';
import { ESource, IActionInputs } from './types';

export const getInputs = (): IActionInputs => {
  const JIRA_TOKEN: string = core.getInput('jira-token', { required: true });
  const JIRA_BASE_URL: string = core.getInput('jira-base-url', { required: true });
  const GITHUB_TOKEN: string = core.getInput('github-token', { required: true });
  const BRANCH_IGNORE_PATTERN: string = core.getInput('skip-branches', { required: false }) || '';
  const CUSTOM_ISSUE_NUMBER_REGEXP = core.getInput('custom-issue-number-regexp', { required: false });
  const JIRA_PROJECT_KEY = core.getInput('jira-project-key', { required: false });
  const FAIL_PR_WHEN_JIRA_ISSUE_NOT_FOUND = core.getInput('fail-pr-when-jira-issue-not-found', { required: false }) || 'false';
  const WHAT_TO_USE: ESource = (core.getInput('use', { required: false }) as ESource) || ESource.prTitle;
  return {
    JIRA_TOKEN,
    GITHUB_TOKEN,
    WHAT_TO_USE,
    BRANCH_IGNORE_PATTERN,
    JIRA_PROJECT_KEY,
    CUSTOM_ISSUE_NUMBER_REGEXP,
    FAIL_PR_WHEN_JIRA_ISSUE_NOT_FOUND,
    JIRA_BASE_URL: JIRA_BASE_URL.endsWith('/') ? JIRA_BASE_URL.replace(/\/$/, '') : JIRA_BASE_URL,
  };
};
