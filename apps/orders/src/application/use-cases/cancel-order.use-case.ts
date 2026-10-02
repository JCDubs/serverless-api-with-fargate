import { ConcurrencyError, OrderNotFoundError } from "../../domain/errors";
import type { Order } from "../../domain/order";
import { OrderEventType, orderEventFrom } from "../events/order-events";
import type { Clock } from "../ports/clock.port";
import type { EventPublisher } from "../ports/event-publisher.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { OrderRepository } from "../ports/order.repository.port";

export interface CancelOrderCommand {
	readonly orderId: string;
	readonly expectedVersion: number;
	readonly correlationId: string;
}

export class CancelOrderUseCase {
	constructor(
		private readonly orders: OrderRepository,
		private readonly events: EventPublisher,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {}

	async execute(command: CancelOrderCommand): Promise<Order> {
		const current = await this.orders.getById(command.orderId);
		if (!current) {
			throw new OrderNotFoundError(command.orderId);
		}

		if (current.version !== command.expectedVersion) {
			throw new ConcurrencyError(command.orderId);
		}

		const cancelled = current.cancel(this.clock.now());
		const saved = await this.orders.update(cancelled, command.expectedVersion);
		await this.events.publish(
			orderEventFrom(OrderEventType.CANCELLED, saved, {
				eventId: this.ids.generate(),
				occurredAt: this.clock.now(),
				correlationId: command.correlationId,
			}),
		);

		return saved;
	}
}
