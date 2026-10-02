import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { mockClient } from "aws-sdk-client-mock";
import { describe, expect, it } from "vitest";
import { toDynamoOrderItem } from "../../../src/adapters/outbound/persistence/dynamodb-order.mapper";
import { DynamoDbOrderRepository } from "../../../src/adapters/outbound/persistence/dynamodb-order.repository";
import { Order } from "../../../src/domain/order";
import { createOrderInput } from "../../support/order-fixtures";

const dynamo = mockClient(DynamoDBDocumentClient);

function repository(): DynamoDbOrderRepository {
	return new DynamoDbOrderRepository(
		"Orders",
		DynamoDBDocumentClient.from(new DynamoDBClient({ region: "eu-west-1" })),
	);
}

describe("DynamoDbOrderRepository", () => {
	it("loads an order by id", async () => {
		const order = Order.create(createOrderInput({ id: "order-1" }));
		dynamo.reset();
		dynamo.on(GetCommand).resolves({ Item: toDynamoOrderItem(order) });

		await expect(repository().getById("order-1")).resolves.toEqual(order);
	});

	it("queries customer orders through gsi1", async () => {
		const order = Order.create(createOrderInput({ id: "order-1" }));
		dynamo.reset();
		dynamo.on(QueryCommand).resolves({ Items: [toDynamoOrderItem(order)] });

		const result = await repository().list({
			customerId: "customer-1",
			limit: 20,
		});

		expect(result.items).toEqual([order]);
		const call = dynamo.commandCalls(QueryCommand)[0];
		expect(call?.args[0].input.IndexName).toBe("gsi1");
	});

	it("writes a new order with a create condition", async () => {
		const order = Order.create(createOrderInput({ id: "order-1" }));
		dynamo.reset();
		dynamo.on(PutCommand).resolves({});

		await repository().save(order);

		const call = dynamo.commandCalls(PutCommand)[0];
		expect(call?.args[0].input.ConditionExpression).toBe(
			"attribute_not_exists(pk)",
		);
	});
});
