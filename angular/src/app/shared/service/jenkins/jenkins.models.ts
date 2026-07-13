// jenkins.models.ts
// Type interfaces for Jenkins REST API responses and local state.

export interface JenkinsJob {
  name: string;
  url: string;
  color: string;
}

export interface JenkinsParamDef {
  name: string;
  type: 'StringParameterDefinition' | 'BooleanParameterDefinition' |
        'ChoiceParameterDefinition' | 'TextParameterDefinition' |
        'PasswordParameterDefinition' | 'string';
  description?: string;
  defaultValue?: string;
  choices?: string[];
}

export interface JenkinsServer {
  id: string;
  label: string;
  url: string;
}

export interface JenkinsCrumb {
  crumb: string;
  crumbRequestField: string;
}

export type BuildStatus =
  | 'idle'
  | 'loading-jobs'
  | 'loading-params'
  | 'fetching-crumb'
  | 'building'
  | 'success'
  | 'error';

export interface ProjectEntry {
  name: string;
  url: string;
  color: string;
  groups: string[];
  lastBuiltAt?: number;
  lastParams?: Record<string, string | boolean>;
}

export interface ParamPreset {
  id: string;
  name: string;
  jobName: string;
  params: Record<string, string | boolean>;
  createdAt: number;
  updatedAt: number;
}

export interface BuildRecord {
  id: string;
  timestamp: number;
  serverLabel: string;
  projectName: string;
  jobName: string;
  presetName?: string;
  params: Record<string, string | boolean>;
  status: 'queued' | 'success' | 'failed';
  resultUrl?: string;
  errorMessage?: string;
}

export interface BatchDialogData {
  projectNames: string[];
  jobName: string;
  serverLabel: string;
  paramSummary: Array<{ key: string; value: string }>;
}
