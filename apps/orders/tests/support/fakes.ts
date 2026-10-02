import type { Clock } from "../../src/application/ports/clock.port";
import type { IdGenerator } from "../../src/application/ports/id-generator.port";

export class FixedClock implements Clock {
	constructor(private readonly timestamp: string) {}

	now(): string {
		return this.timestamp;
	}
}

export class SequenceIdGenerator implements IdGenerator {
	private index = 0;

	constructor(private readonly ids: string[]) {}

	generate(): string {
		const id = this.ids[this.index];
		this.index += 1;
		if (!id) {
			throw new Error("SequenceIdGenerator exhausted");
		}
		return id;
	}
}
