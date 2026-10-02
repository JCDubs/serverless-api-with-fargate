import { describe, expect, it } from "vitest";
import {
	decodeCursor,
	encodeCursor,
	toDynamoOrderItem,
	toOrder,
} from "../../../src/adapters/outbound/persistence/dynamodb-order.mapper";
import { Order } from "../../../src/domain/order";
import { createOrderInput } from "../../support/order-fixtures";

describe("DynamoDB order mapper", () => {
	it("round-trips an order through DynamoDB item shape", () => {
		const order = Order.create(createOrderInput({ id: "order-1" }));
		const item = toDynamoOrderItem(order);

		expect(item.pk).toBe("ORDER#order-1");
		expect(item.gsi1pk).toBe("CUSTOMER#customer-1");
		expect(item.gsi2pk).toBe("ORDERS");
		expect(toOrder(item).toProps()).toEqual(order.toProps());
	});

	it("encodes an opaque pagination cursor", () => {
		const cursor = encodeCursor({ pk: "ORDER#1", sk: "ORDER" });
		expect(decodeCursor(cursor)).toEqual({ pk: "ORDER#1", sk: "ORDER" });
	});
});
