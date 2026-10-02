import { describe, expect, it } from "vitest";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { GetOrderUseCase } from "../../../src/application/use-cases/get-order.use-case";
import { OrderNotFoundError } from "../../../src/domain/errors";
import { Order } from "../../../src/domain/order";
import { createOrderInput } from "../../support/order-fixtures";

describe("GetOrderUseCase", () => {
	it("returns the order when it exists", async () => {
		const orders = new InMemoryOrderRepository();
		const order = Order.create(createOrderInput({ id: "order-1" }));
		await orders.save(order);

		const found = await new GetOrderUseCase(orders).execute("order-1");

		expect(found).toEqual(order);
	});

	it("fails when the order does not exist", async () => {
		const orders = new InMemoryOrderRepository();

		await expect(
			new GetOrderUseCase(orders).execute("missing"),
		).rejects.toBeInstanceOf(OrderNotFoundError);
	});
});
