import {
	EventBridgeClient,
	PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import type { OrderEvent } from "../../../application/events/order-events";
import type { EventPublisher } from "../../../application/ports/event-publisher.port";

export class EventBridgePublisher implements EventPublisher {
	constructor(
		private readonly eventBusName: string,
		private readonly client: EventBridgeClient = new EventBridgeClient({}),
	) {}

	async publish(event: OrderEvent): Promise<void> {
		const result = await this.client.send(
			new PutEventsCommand({
				Entries: [
					{
						EventBusName: this.eventBusName,
						Source: event.source,
						DetailType: event.type,
						Detail: JSON.stringify(event),
						Time: new Date(event.occurredAt),
					},
				],
			}),
		);

		if ((result.FailedEntryCount ?? 0) > 0) {
			throw new Error("Failed to publish order event to EventBridge");
		}
	}
}
