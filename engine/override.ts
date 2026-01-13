export interface OverrideLog {
  timestamp: string;
  action: string;
  reason: string;
  gm: string;
}

export class OverrideManager {
  private logs: OverrideLog[] = [];

  authorize(action: string, reason: string, gm: string): boolean {
    // In a real system, this might check permissions.
    // Here, it just logs it and returns true.
    this.logs.push({
      timestamp: new Date().toISOString(),
      action,
      reason,
      gm
    });
    console.warn(`[OVERRIDE] GM ${gm} authorized: ${action} because "${reason}"`);
    return true;
  }

  getLogs() {
    return this.logs;
  }
}
