import { randomUUID } from "node:crypto";
import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import type { CancelOrderUseCase } from "../../../application/use-cases/cancel-order.use-case";
import type { CreateOrderUseCase } from "../../../application/use-cases/create-order.use-case";
import type { GetOrderUseCase } from "../../../application/use-cases/get-order.use-case";
import type { ListOrdersUseCase } from "../../../application/use-cases/list-orders.use-case";
import type { UpdateOrderUseCase } from "../../../application/use-cases/update-order.use-case";
import type { Logger } from "../../../infrastructure/logger";
import type { Authenticator } from "./auth";
import {
	cancelOrderQuerySchema,
	createOrderBodySchema,
	listOrdersQuerySchema,
	toOrderResponse,
	updateOrderBodySchema,
} from "./dto";
import { mapError } from "./error-mapper";

export interface OrdersHttpDependencies {
	readonly authenticator: Authenticator;
	readonly logger: Logger;
	readonly createOrder: CreateOrderUseCase;
	readonly getOrder: GetOrderUseCase;
	readonly listOrders: ListOrdersUseCase;
	readonly updateOrder: UpdateOrderUseCase;
	readonly cancelOrder: CancelOrderUseCase;
}

declare module "fastify" {
	interface FastifyRequest {
		correlationId: string;
	}
}

export async function buildServer(
	deps: OrdersHttpDependencies,
): Promise<FastifyInstance> {
	const app = Fastify({
		logger: false,
		trustProxy: true,
	});

	app.decorateRequest("correlationId", "");

	app.addHook("onRequest", async (request) => {
		request.correlationId = header(request, "x-correlation-id") ?? randomUUID();
	});

	app.get("/health", async () => ({ status: "ok" }));

	app.get("/orders", async (request, reply) => {
		const actor = await deps.authenticator.authenticate(
			header(request, "authorization"),
		);
		const query = listOrdersQuerySchema.parse(request.query);
		const result = await deps.listOrders.execute(query);
		deps.logger.info("listed orders", {
			correlationId: request.correlationId,
			operation: "ListOrders",
			actor: actor.userId,
			count: result.items.length,
		});
		return reply.send({
			items: result.items.map(toOrderResponse),
			nextCursor: result.nextCursor,
		});
	});

	app.get("/orders/:id", async (request, reply) => {
		await deps.authenticator.authenticate(header(request, "authorization"));
		const { id } = request.params as { id: string };
		const order = await deps.getOrder.execute(id);
		return reply.send(toOrderResponse(order));
	});

	app.post("/orders", async (request, reply) => {
		const actor = await deps.authenticator.authenticate(
			header(request, "authorization"),
		);
		const body = createOrderBodySchema.parse(request.body);
		const order = await deps.createOrder.execute({
			...body,
			createdBy: actor.userId,
			idempotencyKey: header(request, "idempotency-key"),
			correlationId: request.correlationId,
		});
		deps.logger.info("created order", {
			correlationId: request.correlationId,
			operation: "CreateOrder",
			orderId: order.id,
			outcome: "success",
		});
		return reply.status(201).send(toOrderResponse(order));
	});

	app.put("/orders/:id", async (request, reply) => {
		await deps.authenticator.authenticate(header(request, "authorization"));
		const { id } = request.params as { id: string };
		const body = updateOrderBodySchema.parse(request.body);
		const order = await deps.updateOrder.execute({
			orderId: id,
			expectedVersion: body.version,
			comments: body.comments,
			orderLines: body.orderLines,
			status: body.status,
			correlationId: request.correlationId,
		});
		deps.logger.info("updated order", {
			correlationId: request.correlationId,
			operation: "UpdateOrder",
			orderId: order.id,
			status: order.status,
			outcome: "success",
		});
		return reply.send(toOrderResponse(order));
	});

	app.delete("/orders/:id", async (request, reply) => {
		await deps.authenticator.authenticate(header(request, "authorization"));
		const { id } = request.params as { id: string };
		const query = cancelOrderQuerySchema.parse(request.query);
		const order = await deps.cancelOrder.execute({
			orderId: id,
			expectedVersion: query.version,
			correlationId: request.correlationId,
		});
		deps.logger.info("cancelled order", {
			correlationId: request.correlationId,
			operation: "CancelOrder",
			orderId: order.id,
			outcome: "success",
		});
		return reply.send(toOrderResponse(order));
	});

	app.setErrorHandler((error, request, reply) => {
		const mapped = mapError(error, request.correlationId);
		if (mapped.statusCode >= 500) {
			deps.logger.error("request failed", {
				correlationId: request.correlationId,
				operation: request.routeOptions.url,
				outcome: "error",
				errorCategory: mapped.body.error.code,
			});
		} else {
			deps.logger.warn("request rejected", {
				correlationId: request.correlationId,
				operation: request.routeOptions.url,
				outcome: "rejected",
				errorCategory: mapped.body.error.code,
			});
		}

		return reply.status(mapped.statusCode).send(mapped.body);
	});

	return app;
}

function header(request: FastifyRequest, name: string): string | undefined {
	const value = request.headers[name];
	return typeof value === "string" && value.length > 0 ? value : undefined;
}
