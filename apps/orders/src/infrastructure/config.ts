export type PersistenceMode = "memory" | "dynamodb";
export type EventBusMode = "memory" | "eventbridge";

export interface AppConfig {
	readonly port: number;
	readonly nodeEnv: string;
	readonly logLevel: string;
	readonly persistence: PersistenceMode;
	readonly eventBus: EventBusMode;
	readonly tableName?: string;
	readonly eventBusName?: string;
	readonly awsRegion: string;
	readonly authDisabled: boolean;
	readonly cognitoUserPoolId?: string;
	readonly cognitoClientId?: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
	const persistence = (env.ORDER_STORE ?? "memory") as PersistenceMode;
	const eventBus = (env.EVENT_BUS ?? "memory") as EventBusMode;
	const authDisabled = env.AUTH_DISABLED !== "false";

	if (persistence !== "memory" && persistence !== "dynamodb") {
		throw new Error("ORDER_STORE must be memory or dynamodb");
	}

	if (eventBus !== "memory" && eventBus !== "eventbridge") {
		throw new Error("EVENT_BUS must be memory or eventbridge");
	}

	if (persistence === "dynamodb" && !env.TABLE_NAME) {
		throw new Error("TABLE_NAME is required when ORDER_STORE=dynamodb");
	}

	if (eventBus === "eventbridge" && !env.EVENT_BUS_NAME) {
		throw new Error("EVENT_BUS_NAME is required when EVENT_BUS=eventbridge");
	}

	if (!authDisabled && (!env.COGNITO_USER_POOL_ID || !env.COGNITO_CLIENT_ID)) {
		throw new Error(
			"COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required when AUTH_DISABLED=false",
		);
	}

	return {
		port: Number(env.PORT ?? 3000),
		nodeEnv: env.NODE_ENV ?? "development",
		logLevel: env.LOG_LEVEL ?? "info",
		persistence,
		eventBus,
		tableName: env.TABLE_NAME,
		eventBusName: env.EVENT_BUS_NAME,
		awsRegion: env.AWS_REGION ?? "eu-west-1",
		authDisabled,
		cognitoUserPoolId: env.COGNITO_USER_POOL_ID,
		cognitoClientId: env.COGNITO_CLIENT_ID,
	};
}
