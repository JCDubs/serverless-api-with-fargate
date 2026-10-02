import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
	ORDER_EVENT_SOURCE,
	OrderEventType,
	orderEventFrom,
} from "../../src/application/events/order-events";
import { Order } from "../../src/domain/order";
import { OrderStatus } from "../../src/domain/order-status";
import { createOrderInput } from "../support/order-fixtures";

const orderEventSchema = z.object({
	source: z.literal(ORDER_EVENT_SOURCE),
	type: z.enum([
		OrderEventType.CREATED,
		OrderEventType.CONFIRMED,
		OrderEventType.CANCELLED,
	]),
	eventId: z.string().min(1),
	occurredAt: z.string().datetime(),
	correlationId: z.string().min(1),
	orderId: z.string().min(1),
	customerId: z.string().min(1),
	status: z.enum([
		OrderStatus.PENDING,
		OrderStatus.CONFIRMED,
		OrderStatus.SHIPPED,
		OrderStatus.DELIVERED,
		OrderStatus.CANCELLED,
	]),
	totalAmount: z.number().nonnegative(),
	version: z.number().int().positive(),
});

describe("Order event contract", () => {
	it("publishes OrderCreated as a versioned fact", () => {
		const order = Order.create(createOrderInput({ id: "order-1" }));
		const event = orderEventFrom(OrderEventType.CREATED, order, {
			eventId: "event-1",
			occurredAt: "2026-10-02T11:00:00.000Z",
			correlationId: "corr-1",
		});

		expect(orderEventSchema.parse(event)).toEqual(event);
	});
});
