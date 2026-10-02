import { describe, expect, it } from "vitest";
import { loadConfig } from "../../../src/infrastructure/config";

describe("loadConfig", () => {
	it("defaults to an in-memory local development configuration", () => {
		expect(loadConfig({})).toMatchObject({
			port: 3000,
			persistence: "memory",
			eventBus: "memory",
			authDisabled: true,
		});
	});

	it("requires production resource names for AWS adapters", () => {
		expect(() => loadConfig({ ORDER_STORE: "dynamodb" })).toThrow(/TABLE_NAME/);
		expect(() => loadConfig({ EVENT_BUS: "eventbridge" })).toThrow(
			/EVENT_BUS_NAME/,
		);
	});
});
