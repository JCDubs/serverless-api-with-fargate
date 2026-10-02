import type { FastifyInstance } from "fastify";
import { afterEach, describe, expect, it } from "vitest";
import { DisabledAuthenticator } from "../../../src/adapters/inbound/http/auth";
import { buildServer } from "../../../src/adapters/inbound/http/server";
import { InMemoryEventPublisher } from "../../../src/adapters/outbound/messaging/in-memory-event-publisher";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { CancelOrderUseCase } from "../../../src/application/use-cases/cancel-order.use-case";
import { CreateOrderUseCase } from "../../../src/application/use-cases/create-order.use-case";
import { GetOrderUseCase } from "../../../src/application/use-cases/get-order.use-case";
import { ListOrdersUseCase } from "../../../src/application/use-cases/list-orders.use-case";
import { UpdateOrderUseCase } from "../../../src/application/use-cases/update-order.use-case";
import { OrderStatus } from "../../../src/domain/order-status";
import type { Logger } from "../../../src/infrastructure/logger";
import { FixedClock, SequenceIdGenerator } from "../../support/fakes";

const silentLogger: Logger = {
	info() {},
	warn() {},
	error() {},
};

const createBody = {
	customerId: "customer-1",
	branchId: "branch-1",
	comments: "leave at door",
	orderLines: [
		{
			productId: "sku-1",
			productName: "Coffee",
			quantity: 2,
			price: 4.5,
		},
	],
};

async function createApp(): Promise<FastifyInstance> {
	const orders = new InMemoryOrderRepository();
	const events = new InMemoryEventPublisher();
	const clock = new FixedClock("2026-10-02T11:00:00.000Z");
	const ids = new SequenceIdGenerator([
		"order-1",
		"event-1",
		"event-2",
		"event-3",
	]);

	return buildServer({
		authenticator: new DisabledAuthenticator("user-1"),
		logger: silentLogger,
		createOrder: new CreateOrderUseCase(orders, events, clock, ids),
		getOrder: new GetOrderUseCase(orders),
		listOrders: new ListOrdersUseCase(orders),
		updateOrder: new UpdateOrderUseCase(orders, events, clock, ids),
		cancelOrder: new CancelOrderUseCase(orders, events, clock, ids),
	});
}

describe("Orders HTTP API", () => {
	let app: FastifyInstance;

	afterEach(async () => {
		await app?.close();
	});

	it("creates, reads, lists, updates, and cancels an order", async () => {
		app = await createApp();

		const created = await app.inject({
			method: "POST",
			url: "/orders",
			headers: { "x-correlation-id": "corr-1" },
			payload: createBody,
		});

		expect(created.statusCode).toBe(201);
		expect(created.json()).toMatchObject({
			id: "order-1",
			createdBy: "user-1",
			status: OrderStatus.PENDING,
			totalAmount: 9,
			version: 1,
		});

		const fetched = await app.inject({
			method: "GET",
			url: "/orders/order-1",
		});
		expect(fetched.statusCode).toBe(200);
		expect(fetched.json().id).toBe("order-1");

		const listed = await app.inject({
			method: "GET",
			url: "/orders?customerId=customer-1",
		});
		expect(listed.statusCode).toBe(200);
		expect(listed.json().items).toHaveLength(1);

		const confirmed = await app.inject({
			method: "PUT",
			url: "/orders/order-1",
			payload: { version: 1, status: OrderStatus.CONFIRMED },
		});
		expect(confirmed.statusCode).toBe(200);
		expect(confirmed.json().status).toBe(OrderStatus.CONFIRMED);

		const cancelled = await app.inject({
			method: "DELETE",
			url: "/orders/order-1?version=2",
		});
		expect(cancelled.statusCode).toBe(200);
		expect(cancelled.json().status).toBe(OrderStatus.CANCELLED);
	});

	it("returns 400 for an invalid create payload", async () => {
		app = await createApp();

		const response = await app.inject({
			method: "POST",
			url: "/orders",
			payload: { customerId: "customer-1" },
		});

		expect(response.statusCode).toBe(400);
		expect(response.json().error.code).toBe("VALIDATION_ERROR");
	});

	it("returns 404 for a missing order", async () => {
		app = await createApp();

		const response = await app.inject({
			method: "GET",
			url: "/orders/missing",
		});

		expect(response.statusCode).toBe(404);
		expect(response.json().error.code).toBe("ORDER_NOT_FOUND");
	});

	it("exposes a public health check", async () => {
		app = await createApp();

		const response = await app.inject({ method: "GET", url: "/health" });

		expect(response.statusCode).toBe(200);
		expect(response.json()).toEqual({ status: "ok" });
	});
});
