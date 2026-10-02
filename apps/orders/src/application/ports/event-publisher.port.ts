import type { OrderEvent } from "../events/order-events";

export interface EventPublisher {
	publish(event: OrderEvent): Promise<void>;
}
