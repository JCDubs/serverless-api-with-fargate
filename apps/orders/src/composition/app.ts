import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { EventBridgeClient } from "@aws-sdk/client-eventbridge";
import type { FastifyInstance } from "fastify";
import {
	CognitoAuthenticator,
	DisabledAuthenticator,
} from "../adapters/inbound/http/auth";
import { buildServer } from "../adapters/inbound/http/server";
import { EventBridgePublisher } from "../adapters/outbound/messaging/eventbridge-publisher";
import { InMemoryEventPublisher } from "../adapters/outbound/messaging/in-memory-event-publisher";
import { DynamoDbOrderRepository } from "../adapters/outbound/persistence/dynamodb-order.repository";
import { InMemoryOrderRepository } from "../adapters/outbound/persistence/in-memory-order.repository";
import type { EventPublisher } from "../application/ports/event-publisher.port";
import type { OrderRepository } from "../application/ports/order.repository.port";
import { CancelOrderUseCase } from "../application/use-cases/cancel-order.use-case";
import { CreateOrderUseCase } from "../application/use-cases/create-order.use-case";
import { GetOrderUseCase } from "../application/use-cases/get-order.use-case";
import { ListOrdersUseCase } from "../application/use-cases/list-orders.use-case";
import { UpdateOrderUseCase } from "../application/use-cases/update-order.use-case";
import type { AppConfig } from "../infrastructure/config";
import { ConsoleLogger } from "../infrastructure/logger";
import { SystemClock } from "../infrastructure/system-clock";
import { UuidGenerator } from "../infrastructure/uuid-generator";

export async function composeApp(config: AppConfig): Promise<FastifyInstance> {
	const logger = new ConsoleLogger();
	const clock = new SystemClock();
	const ids = new UuidGenerator();
	const orders = createRepository(config);
	const events = createPublisher(config);
	const authenticator = config.authDisabled
		? new DisabledAuthenticator()
		: new CognitoAuthenticator(
				config.cognitoUserPoolId ?? "",
				config.cognitoClientId ?? "",
			);

	return buildServer({
		authenticator,
		logger,
		createOrder: new CreateOrderUseCase(orders, events, clock, ids),
		getOrder: new GetOrderUseCase(orders),
		listOrders: new ListOrdersUseCase(orders),
		updateOrder: new UpdateOrderUseCase(orders, events, clock, ids),
		cancelOrder: new CancelOrderUseCase(orders, events, clock, ids),
	});
}

function createRepository(config: AppConfig): OrderRepository {
	if (config.persistence === "dynamodb") {
		return new DynamoDbOrderRepository(
			config.tableName ?? "",
			new DynamoDBClient({ region: config.awsRegion }),
		);
	}

	return new InMemoryOrderRepository();
}

function createPublisher(config: AppConfig): EventPublisher {
	if (config.eventBus === "eventbridge") {
		return new EventBridgePublisher(
			config.eventBusName ?? "",
			new EventBridgeClient({ region: config.awsRegion }),
		);
	}

	return new InMemoryEventPublisher();
}
