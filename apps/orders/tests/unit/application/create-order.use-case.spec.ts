import { describe, expect, it } from "vitest";
import { InMemoryEventPublisher } from "../../../src/adapters/outbound/messaging/in-memory-event-publisher";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { OrderEventType } from "../../../src/application/events/order-events";
import { CreateOrderUseCase } from "../../../src/application/use-cases/create-order.use-case";
import { OrderStatus } from "../../../src/domain/order-status";
import { FixedClock, SequenceIdGenerator } from "../../support/fakes";
import { createOrderInput } from "../../support/order-fixtures";

function createUseCase() {
	const orders = new InMemoryOrderRepository();
	const events = new InMemoryEventPublisher();
	const useCase = new CreateOrderUseCase(
		orders,
		events,
		new FixedClock("2026-10-02T11:00:00.000Z"),
		new SequenceIdGenerator(["order-1", "event-1"]),
	);

	return { orders, events, useCase };
}

describe("CreateOrderUseCase", () => {
	it("persists a pending order and publishes OrderCreated", async () => {
		const { orders, events, useCase } = createUseCase();
		const input = createOrderInput();

		const order = await useCase.execute({
			customerId: input.customerId,
			createdBy: input.createdBy,
			branchId: input.branchId,
			comments: input.comments,
			orderLines: input.orderLines,
			correlationId: "corr-1",
		});

		expect(order.id).toBe("order-1");
		expect(order.status).toBe(OrderStatus.PENDING);
		expect(await orders.getById("order-1")).toEqual(order);
		expect(events.events).toHaveLength(1);
		expect(events.events[0]?.type).toBe(OrderEventType.CREATED);
		expect(events.events[0]?.correlationId).toBe("corr-1");
	});

	it("replays an existing order for the same idempotency key", async () => {
		const { events, useCase } = createUseCase();
		const input = createOrderInput();
		const command = {
			customerId: input.customerId,
			createdBy: input.createdBy,
			branchId: input.branchId,
			comments: input.comments,
			orderLines: input.orderLines,
			idempotencyKey: "idem-1",
			correlationId: "corr-1",
		};

		const first = await useCase.execute(command);
		const second = await useCase.execute(command);

		expect(second.id).toBe(first.id);
		expect(events.events).toHaveLength(1);
	});
});
