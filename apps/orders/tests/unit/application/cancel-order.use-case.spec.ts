import { describe, expect, it } from "vitest";
import { InMemoryEventPublisher } from "../../../src/adapters/outbound/messaging/in-memory-event-publisher";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { OrderEventType } from "../../../src/application/events/order-events";
import { CancelOrderUseCase } from "../../../src/application/use-cases/cancel-order.use-case";
import { Order } from "../../../src/domain/order";
import { OrderStatus } from "../../../src/domain/order-status";
import { FixedClock, SequenceIdGenerator } from "../../support/fakes";
import { createOrderInput } from "../../support/order-fixtures";

describe("CancelOrderUseCase", () => {
	it("cancels an order and publishes OrderCancelled", async () => {
		const orders = new InMemoryOrderRepository();
		const events = new InMemoryEventPublisher();
		const existing = Order.create(createOrderInput({ id: "order-1" }));
		await orders.save(existing);

		const cancelled = await new CancelOrderUseCase(
			orders,
			events,
			new FixedClock("2026-10-02T12:00:00.000Z"),
			new SequenceIdGenerator(["event-1"]),
		).execute({
			orderId: "order-1",
			expectedVersion: 1,
			correlationId: "corr-1",
		});

		expect(cancelled.status).toBe(OrderStatus.CANCELLED);
		expect(events.events[0]?.type).toBe(OrderEventType.CANCELLED);
	});
});
