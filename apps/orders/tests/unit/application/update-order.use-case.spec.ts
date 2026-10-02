import { describe, expect, it } from "vitest";
import { InMemoryEventPublisher } from "../../../src/adapters/outbound/messaging/in-memory-event-publisher";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { OrderEventType } from "../../../src/application/events/order-events";
import { UpdateOrderUseCase } from "../../../src/application/use-cases/update-order.use-case";
import { ConcurrencyError } from "../../../src/domain/errors";
import { Order } from "../../../src/domain/order";
import { OrderStatus } from "../../../src/domain/order-status";
import { FixedClock, SequenceIdGenerator } from "../../support/fakes";
import { createOrderInput } from "../../support/order-fixtures";

function createUseCase(existing: Order) {
	const orders = new InMemoryOrderRepository();
	const events = new InMemoryEventPublisher();
	const useCase = new UpdateOrderUseCase(
		orders,
		events,
		new FixedClock("2026-10-02T12:00:00.000Z"),
		new SequenceIdGenerator(["event-1"]),
	);

	return { orders, events, useCase, existing };
}

describe("UpdateOrderUseCase", () => {
	it("confirms a pending order and publishes OrderConfirmed", async () => {
		const existing = Order.create(createOrderInput({ id: "order-1" }));
		const { orders, events, useCase } = createUseCase(existing);
		await orders.save(existing);

		const updated = await useCase.execute({
			orderId: "order-1",
			expectedVersion: 1,
			status: OrderStatus.CONFIRMED,
			correlationId: "corr-1",
		});

		expect(updated.status).toBe(OrderStatus.CONFIRMED);
		expect(updated.version).toBe(2);
		expect(events.events[0]?.type).toBe(OrderEventType.CONFIRMED);
	});

	it("rejects a stale version", async () => {
		const existing = Order.create(createOrderInput({ id: "order-1" }));
		const { orders, useCase } = createUseCase(existing);
		await orders.save(existing);

		await expect(
			useCase.execute({
				orderId: "order-1",
				expectedVersion: 99,
				status: OrderStatus.CONFIRMED,
				correlationId: "corr-1",
			}),
		).rejects.toBeInstanceOf(ConcurrencyError);
	});
});
