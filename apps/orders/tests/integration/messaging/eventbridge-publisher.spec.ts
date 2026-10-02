import {
	EventBridgeClient,
	PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { mockClient } from "aws-sdk-client-mock";
import { describe, expect, it } from "vitest";
import { EventBridgePublisher } from "../../../src/adapters/outbound/messaging/eventbridge-publisher";
import {
	OrderEventType,
	orderEventFrom,
} from "../../../src/application/events/order-events";
import { Order } from "../../../src/domain/order";
import { createOrderInput } from "../../support/order-fixtures";

const eventBridge = mockClient(EventBridgeClient);

describe("EventBridgePublisher", () => {
	it("publishes the order event contract to the configured bus", async () => {
		eventBridge.reset();
		eventBridge.on(PutEventsCommand).resolves({ FailedEntryCount: 0 });
		const order = Order.create(createOrderInput({ id: "order-1" }));
		const event = orderEventFrom(OrderEventType.CREATED, order, {
			eventId: "event-1",
			occurredAt: "2026-10-02T11:00:00.000Z",
			correlationId: "corr-1",
		});

		await new EventBridgePublisher(
			"orders",
			eventBridge as unknown as EventBridgeClient,
		).publish(event);

		const call = eventBridge.commandCalls(PutEventsCommand)[0];
		expect(call?.args[0].input.Entries?.[0]).toMatchObject({
			EventBusName: "orders",
			Source: "orders.service",
			DetailType: "OrderCreated",
		});
	});
});
