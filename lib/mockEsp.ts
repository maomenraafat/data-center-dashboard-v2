// Simulated ESP hardware so the whole UI (2FA entrance + control panel) works with no
// physical board connected. A module-level singleton keeps state across renders.

import type { ControlCommand, ControlKind, Esp1Status, SecurityState } from "./types";

export interface ControlResult {
  ok: boolean;
  led: ControlKind | null;
  message: string;
}

class MockEsp {
  private state: SecurityState = "LOCKED";
  private code = "1234";

  /** Keep the mock's accepted code in sync with the settings popover. */
  setCode(code: string) {
    if (code.length > 0) this.code = code;
  }

  getStatus(): Esp1Status {
    return {
      state: this.state,
      greenLed: this.state === "UNLOCKED",
      timerRunning: false,
      time: 0,
    };
  }

  /** Step 1 of 2FA: enter the keypad code. Returns true if accepted. */
  enterCode(code: string): boolean {
    if (this.state !== "LOCKED") return false;
    if (code === this.code) {
      this.state = "SCAN_RFID";
      return true;
    }
    return false;
  }

  /** Step 2 of 2FA: scan the RFID card. Returns true if it unlocked. */
  scanRfid(): boolean {
    if (this.state !== "SCAN_RFID") return false;
    this.state = "UNLOCKED";
    return true;
  }

  /** Back to LOCKED (used by "Lock again"). */
  reset() {
    this.state = "LOCKED";
  }

  /** Pretend to run a control command and report which LED lit up. */
  simulateControl(cmd: ControlCommand): ControlResult {
    const ledByPath: Record<string, ControlKind> = {
      "/network": "network",
      "/loadbalancing": "loadbalancing",
      "/disasterrecovery": "disasterrecovery",
      "/workloadrouting": "workloadrouting",
    };
    return {
      ok: true,
      led: ledByPath[cmd.path] ?? null,
      message: `Simulated ${cmd.parameter}=${cmd.value} → ${cmd.path}`,
    };
  }
}

export const mockEsp = new MockEsp();
