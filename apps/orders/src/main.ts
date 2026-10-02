import { composeApp } from "./composition/app";
import { loadConfig } from "./infrastructure/config";
import { ConsoleLogger } from "./infrastructure/logger";

async function main(): Promise<void> {
	const config = loadConfig();
	const logger = new ConsoleLogger();
	const app = await composeApp(config);

	const close = async (signal: string) => {
		logger.info("shutting down", { operation: "shutdown", signal });
		await app.close();
		process.exit(0);
	};

	process.on("SIGTERM", () => {
		void close("SIGTERM");
	});
	process.on("SIGINT", () => {
		void close("SIGINT");
	});

	await app.listen({ port: config.port, host: "0.0.0.0" });
	logger.info("orders service listening", {
		operation: "startup",
		port: config.port,
		persistence: config.persistence,
		eventBus: config.eventBus,
	});
}

void main().catch((error: unknown) => {
	const logger = new ConsoleLogger();
	logger.error("failed to start orders service", {
		operation: "startup",
		outcome: "error",
		errorCategory: error instanceof Error ? error.name : "UnknownError",
	});
	process.exit(1);
});
