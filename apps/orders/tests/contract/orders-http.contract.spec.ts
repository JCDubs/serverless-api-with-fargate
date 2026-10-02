import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toOrderResponse } from "../../src/adapters/inbound/http/dto";
import { Order } from "../../src/domain/order";
import { OrderStatus } from "../../src/domain/order-status";
import { createOrderInput } from "../support/order-fixtures";

const orderResponseSchema = z.object({
	id: z.string(),
	customerId: z.string(),
	createdBy: z.string(),
	branchId: z.string(),
	comments: z.string(),
	status: z.enum([
		OrderStatus.PENDING,
		OrderStatus.CONFIRMED,
		OrderStatus.SHIPPED,
		OrderStatus.DELIVERED,
		OrderStatus.CANCELLED,
	]),
	totalAmount: z.number(),
	createdDateTime: z.string().datetime(),
	updatedDateTime: z.string().datetime(),
	version: z.number().int().positive(),
	orderLines: z.array(
		z.object({
			id: z.string(),
			productId: z.string(),
			productName: z.string(),
			quantity: z.number().int().positive(),
			price: z.number(),
			total: z.number(),
		}),
	),
});

describe("Orders HTTP contract", () => {
	it("serializes an order response without leaking persistence keys", () => {
		const response = toOrderResponse(
			Order.create(createOrderInput({ id: "order-1" })),
		);

		expect(orderResponseSchema.parse(response)).toEqual(response);
		expect(response).not.toHaveProperty("pk");
		expect(response).not.toHaveProperty("sk");
	});
});
