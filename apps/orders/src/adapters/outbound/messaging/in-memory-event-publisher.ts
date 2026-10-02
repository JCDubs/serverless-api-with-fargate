import type { OrderEvent } from "../../../application/events/order-events";
import type { EventPublisher } from "../../../application/ports/event-publisher.port";

export class InMemoryEventPublisher implements EventPublisher {
	readonly events: OrderEvent[] = [];

	async publish(event: OrderEvent): Promise<void> {
		this.events.push(event);
	}
}
