export interface Pipeline {
  id: string; name: string; status: 'success' | 'failed' | 'running' | 'pending';
  branch: string; commit: string; stages: PipelineStage[];
  startedAt: string; duration: number;
}
export interface PipelineStage {
  name: string; status: 'success' | 'failed' | 'running' | 'pending' | 'skipped';
  duration: number; logs?: string;
}
export interface Container {
  id: string; name: string; image: string; status: 'running' | 'exited' | 'paused';
  cpuPercent: number; memoryBytes: number; memoryLimit: number;
  ports: { host: number; container: number }[];
  restarts: number; health?: 'healthy' | 'unhealthy' | 'starting';
  startedAt: string;
}
export interface K8sPod {
  uid: string; name: string; namespace: string; status: string;
  restarts: number; ageSeconds: number; node: string;
  containers: number; ready: number; phase: string;
  conditions: { type: string; status: string }[];
}
export interface K8sNode {
  name: string; status: string;
  cpuCores: { used: number; total: number };
  memoryBytes: { used: number; total: number };
  pods: number; podCapacity: number; ageSeconds: number;
  osImage?: string; kernelVersion?: string;
}
export interface LogEntry {
  timestamp: string; level: 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
  service: string; message: string; traceId?: string;
}
export interface Alert {
  id: string; fingerprint: string; severity: 'critical' | 'warning' | 'info';
  title: string; message: string; service: string;
  timestamp: string; acknowledged: boolean;
  acknowledgedBy?: string; acknowledgedAt?: string;
  silenced: boolean; runbookUrl?: string; generatorUrl?: string;
}
export interface DashboardMetric {
  label: string; value: number; max: number; unit: string; color: string;
}
export interface Environment {
  name: string; region: string; status: 'healthy' | 'degraded' | 'down';
  uptime: number; lastDeploy: string; version: string; errorRate: number;
}
