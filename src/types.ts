export enum ESource {
  branch = 'branch',
  prTitle = 'pr-title',
  both = 'both',
}

export interface PullRequestParams {
  number: number;
  html_url?: string;
  body?: string;
  base: {
    ref: string;
  };
  head: {
    ref: string;
  };
  changed_files?: number;
  additions?: number;
  title?: string;

  [key: string]: unknown;
}

export namespace JIRA {
  export interface IssueStatus {
    self: string;
    description: string;
    iconUrl: string;
    name: string;
    id: string;
    statusCategory: {
      self: string;
      id: number;
      key: string;
      colorName: string;
      name: string;
    };
  }

  export interface IssuePriority {
    self: string;
    iconUrl: string;
    name: string;
    id: string;
  }

  export interface IssueType {
    self: string;
    id: string;
    description: string;
    iconUrl: string;
    name: string;
    subtask: boolean;
    avatarId: number;
  }

  export interface IssueProject {
    self: string;
    key: string;
    name: string;
  }

  export interface Issue {
    id: string;
    key: string;
    self: string;
    fields: {
      summary: string;
      status: IssueStatus;
      priority: IssuePriority;
      issuetype: IssueType;
      project: IssueProject;
      labels: string[];
      [k: string]: unknown;
    };
  }
}

export interface JIRADetails {
  key: string;
  summary: string;
  url: string;
  type: {
    name: string;
    icon: string;
  };
  project: {
    name: string;
    url: string;
    key: string;
  };
}

export interface IActionInputs {
  JIRA_TOKEN: string;
  WHAT_TO_USE: ESource;
  JIRA_BASE_URL: string;
  GITHUB_TOKEN: string;
  BRANCH_IGNORE_PATTERN: string;
  JIRA_PROJECT_KEY: string;
  CUSTOM_ISSUE_NUMBER_REGEXP: string;
  FAIL_WHEN_JIRA_ISSUE_NOT_FOUND: boolean;
}

export interface IGithubData {
  eventName: string;
  repository: any;
  owner: string;
  pullRequest: PullRequestParams;
}
