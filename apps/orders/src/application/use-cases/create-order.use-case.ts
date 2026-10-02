import { Order } from "../../domain/order";
import type { CreateOrderLineInput } from "../../domain/order-line";
import { OrderEventType, orderEventFrom } from "../events/order-events";
import type { Clock } from "../ports/clock.port";
import type { EventPublisher } from "../ports/event-publisher.port";
import type { IdGenerator } from "../ports/id-generator.port";
import type { OrderRepository } from "../ports/order.repository.port";

export interface CreateOrderCommand {
	readonly customerId: string;
	readonly createdBy: string;
	readonly branchId: string;
	readonly comments?: string;
	readonly orderLines: readonly CreateOrderLineInput[];
	readonly idempotencyKey?: string;
	readonly correlationId: string;
}

export class CreateOrderUseCase {
	constructor(
		private readonly orders: OrderRepository,
		private readonly events: EventPublisher,
		private readonly clock: Clock,
		private readonly ids: IdGenerator,
	) {}

	async execute(command: CreateOrderCommand): Promise<Order> {
		if (command.idempotencyKey) {
			const replayed = await this.orders.findByIdempotencyKey(
				command.idempotencyKey,
			);
			if (replayed) {
				return replayed;
			}
		}

		const order = Order.create({
			id: this.ids.generate(),
			customerId: command.customerId,
			createdBy: command.createdBy,
			branchId: command.branchId,
			comments: command.comments,
			now: this.clock.now(),
			orderLines: command.orderLines,
		});

		const saved = await this.orders.save(order, command.idempotencyKey);
		await this.events.publish(
			orderEventFrom(OrderEventType.CREATED, saved, {
				eventId: this.ids.generate(),
				occurredAt: this.clock.now(),
				correlationId: command.correlationId,
			}),
		);

		return saved;
	}
}
