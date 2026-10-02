import { ConcurrencyError, OrderNotFoundError } from "../../domain/errors";
import type { Order } from "../../domain/order";
import type { CreateOrderLineInput } from "../../domain/order-line";
import { OrderStatus } from "../../domain/order-status";
import { OrderEventType, orderEventFrom } from "../events/order-events";
import type { Clock } from "../ports/clock.port";
import type { EventPublisher } from "../ports/event-publisher.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { OrderRepository } from "../ports/order.repository.port";

export interface UpdateOrderCommand {
	readonly orderId: string;
	readonly expectedVersion: number;
	readonly comments?: string;
	readonly orderLines?: readonly CreateOrderLineInput[];
	readonly status?: OrderStatus;
	readonly correlationId: string;
}

export class UpdateOrderUseCase {
	constructor(
		private readonly orders: OrderRepository,
		private readonly events: EventPublisher,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {}

	async execute(command: UpdateOrderCommand): Promise<Order> {
		const current = await this.orders.getById(command.orderId);
		if (!current) {
			throw new OrderNotFoundError(command.orderId);
		}

		if (current.version !== command.expectedVersion) {
			throw new ConcurrencyError(command.orderId);
		}

		const now = this.clock.now();
		let next = current;

		if (command.comments !== undefined || command.orderLines !== undefined) {
			next = next.update({
				comments: command.comments,
				orderLines: command.orderLines,
				now,
			});
		}

		if (command.status && command.status !== next.status) {
			next = applyStatus(next, command.status, now);
		}

		const saved = await this.orders.update(next, command.expectedVersion);
		const eventType = eventTypeFor(current.status, saved.status);
		if (eventType) {
			await this.events.publish(
				orderEventFrom(eventType, saved, {
					eventId: this.ids.generate(),
					occurredAt: now,
					correlationId: command.correlationId,
				}),
			);
		}

		return saved;
	}
}

function applyStatus(order: Order, status: OrderStatus, now: string): Order {
	switch (status) {
		case OrderStatus.CONFIRMED:
			return order.confirm(now);
		case OrderStatus.SHIPPED:
			return order.ship(now);
		case OrderStatus.DELIVERED:
			return order.deliver(now);
		case OrderStatus.CANCELLED:
			return order.cancel(now);
		default:
			return order;
	}
}

function eventTypeFor(
	from: OrderStatus,
	to: OrderStatus,
): OrderEventType | undefined {
	if (from === to) {
		return undefined;
	}

	if (to === OrderStatus.CONFIRMED) {
		return OrderEventType.CONFIRMED;
	}

	if (to === OrderStatus.CANCELLED) {
		return OrderEventType.CANCELLED;
	}

	return undefined;
}
