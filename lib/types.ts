export type AnomalyType = 'CLIENT_CRASH' | 'SERVER_ERROR' | 'DEAD_END';

export type AnomalySeverity = 'CRITICAL' | 'WARNING';

export interface ActionBreadcrumb {
  step: number;
  action: 'navigate' | 'click' | 'input' | 'submit';
  selector?: string;
  targetText?: string;
  value?: string;
  url?: string;
  timestamp: number;
}

export interface AnomalyEvidence {
  type: AnomalyType;
  url: string;
  triggerAction: string;
  targetSelector?: string;
  requestPayload?: Record<string, any> | string;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  stackTrace?: string;
  stateId: string;
  stateName: string;
  breadcrumbs: ActionBreadcrumb[];
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  route: string;
  selector?: string;
  summary: string;
  explanation: string;
  evidence: AnomalyEvidence;
  timestamp: number;
}

export interface StateNodeData {
  label: string;
  route: string;
  pageTitle: string;
  landmarks: string[];
  interactiveCount: number;
  isDeadEnd?: boolean;
  hasCrash?: boolean;
  hasServerError?: boolean;
  status: 'HEALTHY' | 'ANOMALY_CRASH' | 'ANOMALY_500' | 'ANOMALY_DEAD_END';
  anomalyId?: string;
  [key: string]: unknown;
}

export interface StateNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: StateNodeData;
}

export interface StateEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
  style?: Record<string, any>;
  data?: {
    action: string;
    selector?: string;
    isFailure?: boolean;
  };
}

export interface ActionEvent {
  id: string;
  timestamp: string;
  level: 'INFO' | 'ACTION' | 'ERROR' | 'NETWORK';
  message: string;
  details?: Record<string, any>;
}

export interface ReplayStep {
  stepNumber: number;
  totalSteps: number;
  action: 'navigate' | 'click' | 'input' | 'submit' | 'observe';
  description: string;
  targetSelector?: string;
  targetText?: string;
  inputValue?: string;
  currentUrl: string;
  pageTitle: string;
  screenshotBase64?: string;
  status: 'PENDING' | 'EXECUTING' | 'SUCCESS' | 'FAILED';
  errorDetails?: {
    type: AnomalyType;
    message: string;
    status?: number;
  };
  timestamp: number;
}

export interface CrawlReport {
  targetUrl: string;
  scanDurationMs: number;
  statesCount: number;
  transitionsCount: number;
  nodes: StateNode[];
  edges: StateEdge[];
  anomalies: Anomaly[];
  actionLog: ActionEvent[];
  mode: 'LIVE_PLAYWRIGHT' | 'DETERMINISTIC_ENGINE';
}
