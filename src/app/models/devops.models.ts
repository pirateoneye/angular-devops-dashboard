export interface Pipeline {
  id: string;
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'cancelled';
  branch: string;
  commit: string;
  author: string;
  duration: string;
  startedAt: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  duration: string;
}

export interface Container {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'exited' | 'paused' | 'restarting';
  ports: string[];
  cpu: number;
  memory: number;
  memoryLimit: number;
  uptime: string;
  health?: 'healthy' | 'unhealthy' | 'starting';
}

export interface K8sPod {
  name: string;
  namespace: string;
  status: 'Running' | 'Pending' | 'Failed' | 'Succeeded' | 'Unknown';
  restarts: number;
  age: string;
  node: string;
  containers: number;
  ready: number;
}

export interface K8sNode {
  name: string;
  status: 'Ready' | 'NotReady';
  cpu: { used: number; total: number };
  memory: { used: number; total: number };
  pods: number;
  age: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string;
  message: string;
  traceId?: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  service: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface SystemMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  changeType: 'up' | 'down' | 'neutral';
}

export interface Environment {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: string;
  requestsPerMin: number;
  errorRate: number;
  latency: number;
  lastDeploy: string;
}
