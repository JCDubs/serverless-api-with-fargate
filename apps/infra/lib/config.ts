export type DeployEnvironment = "dev" | "prod";

export interface EnvironmentConfig {
	readonly environment: DeployEnvironment;
	readonly natGateways: number;
	readonly desiredCount: number;
	readonly minCapacity: number;
	readonly maxCapacity: number;
	readonly pointInTimeRecovery: boolean;
	readonly retainStatefulResources: boolean;
	readonly certificateArn?: string;
	readonly cpu: number;
	readonly memoryLimitMiB: number;
	readonly cpuTargetUtilization: number;
}

export function resolveEnvironmentConfig(
	environment: string | undefined,
	certificateArn?: string,
): EnvironmentConfig {
	const env: DeployEnvironment = environment === "prod" ? "prod" : "dev";
	const isProd = env === "prod";

	return {
		environment: env,
		natGateways: isProd ? 2 : 1,
		desiredCount: isProd ? 2 : 1,
		minCapacity: isProd ? 2 : 1,
		maxCapacity: isProd ? 6 : 2,
		pointInTimeRecovery: isProd,
		retainStatefulResources: isProd,
		certificateArn,
		cpu: 256,
		memoryLimitMiB: 512,
		cpuTargetUtilization: 70,
	};
}
