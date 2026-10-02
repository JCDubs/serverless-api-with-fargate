import type { Order } from "../../domain/order";
import type { OrderStatus } from "../../domain/order-status";

export const ORDER_EVENT_SOURCE = "orders.service";

export const OrderEventType = {
	CREATED: "OrderCreated",
	CONFIRMED: "OrderConfirmed",
	CANCELLED: "OrderCancelled",
} as const;

export type OrderEventType =
	(typeof OrderEventType)[keyof typeof OrderEventType];

export interface OrderEvent {
	readonly source: typeof ORDER_EVENT_SOURCE;
	readonly type: OrderEventType;
	readonly eventId: string;
	readonly occurredAt: string;
	readonly correlationId: string;
	readonly orderId: string;
	readonly customerId: string;
	readonly status: OrderStatus;
	readonly totalAmount: number;
	readonly version: number;
}

export function orderEventFrom(
	type: OrderEventType,
	order: Order,
	input: { eventId: string; occurredAt: string; correlationId: string },
): OrderEvent {
	return {
		source: ORDER_EVENT_SOURCE,
		type,
		eventId: input.eventId,
		occurredAt: input.occurredAt,
		correlationId: input.correlationId,
		orderId: order.id,
		customerId: order.customerId,
		status: order.status,
		totalAmount: order.totalAmount,
		version: order.version,
	};
}
