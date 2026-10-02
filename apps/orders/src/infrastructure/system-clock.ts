import type { Clock } from "../application/ports/clock.port";

export class SystemClock implements Clock {
	now(): string {
		return new Date().toISOString();
	}
}
