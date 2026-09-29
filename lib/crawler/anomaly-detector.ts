import { Anomaly, AnomalyType, ActionBreadcrumb, StateNode } from '../types';

export interface RawObservedEvent {
  type: 'CRASH' | '500_ERROR' | 'DEAD_END';
  route: string;
  stateId: string;
  stateName: string;
  triggerAction: string;
  targetSelector?: string;
  url: string;
  requestPayload?: any;
  responseStatus?: number;
  responseBody?: string;
  errorMessage?: string;
  stackTrace?: string;
  breadcrumbs: ActionBreadcrumb[];
}

export function createAnomalyFromObservation(observed: RawObservedEvent): Anomaly {
  const timestamp = Date.now();

  if (observed.type === 'CRASH') {
    return {
      id: `anom_crash_${timestamp}`,
      type: 'CLIENT_CRASH',
      severity: 'CRITICAL',
      title: 'Unhandled Client Runtime Exception (TypeError)',
      route: observed.route,
      selector: observed.targetSelector,
      summary: observed.errorMessage || 'Uncaught TypeError: Cannot read properties of undefined',
      explanation: 'A client-side JavaScript execution failure broke the application thread. The promo code button handler attempted to invoke a method on an undefined object without null checking.',
      evidence: {
        type: 'CLIENT_CRASH',
        url: observed.url,
        triggerAction: observed.triggerAction,
        targetSelector: observed.targetSelector,
        errorMessage: observed.errorMessage,
        stackTrace: observed.stackTrace,
        stateId: observed.stateId,
        stateName: observed.stateName,
        breadcrumbs: observed.breadcrumbs,
      },
      timestamp,
    };
  }

  if (observed.type === '500_ERROR') {
    return {
      id: `anom_500_${timestamp}`,
      type: 'SERVER_ERROR',
      severity: 'CRITICAL',
      title: 'HTTP 500 Internal Server Error (Deadlock)',
      route: observed.route,
      selector: observed.targetSelector,
      summary: observed.responseBody || 'HTTP 500 Internal Server Error: Database transaction deadlocked',
      explanation: 'The checkout transaction endpoint returned a 500 internal server error upon receiving postal code "00000". The frontend did not display an error banner, leaving the checkout submit button permanently in a loading state.',
      evidence: {
        type: 'SERVER_ERROR',
        url: observed.url,
        triggerAction: observed.triggerAction,
        targetSelector: observed.targetSelector,
        requestPayload: observed.requestPayload,
        responseStatus: observed.responseStatus || 500,
        responseBody: observed.responseBody,
        stateId: observed.stateId,
        stateName: observed.stateName,
        breadcrumbs: observed.breadcrumbs,
      },
      timestamp,
    };
  }

  // DEAD END
  return {
    id: `anom_deadend_${timestamp}`,
    type: 'DEAD_END',
    severity: 'WARNING',
    title: 'Dead-End Navigation Trap',
    route: observed.route,
    selector: observed.targetSelector,
    summary: 'Node renders 0 interactive elements with no navigation links, home button, or return path.',
    explanation: 'The user navigated from the login modal into the password recovery view. The target page renders an isolated error card with zero outbound interactive elements, stranding the user.',
    evidence: {
      type: 'DEAD_END',
      url: observed.url,
      triggerAction: observed.triggerAction,
      targetSelector: observed.targetSelector,
      stateId: observed.stateId,
      stateName: observed.stateName,
      breadcrumbs: observed.breadcrumbs,
    },
    timestamp,
  };
}
