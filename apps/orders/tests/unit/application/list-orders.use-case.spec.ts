import { describe, expect, it } from "vitest";
import { InMemoryOrderRepository } from "../../../src/adapters/outbound/persistence/in-memory-order.repository";
import { ListOrdersUseCase } from "../../../src/application/use-cases/list-orders.use-case";
import { Order } from "../../../src/domain/order";
import { createOrderInput } from "../../support/order-fixtures";

describe("ListOrdersUseCase", () => {
	it("lists customer orders with a next cursor", async () => {
		const orders = new InMemoryOrderRepository();
		await orders.save(
			Order.create(
				createOrderInput({
					id: "order-1",
					now: "2026-10-02T11:00:00.000Z",
				}),
			),
		);
		await orders.save(
			Order.create(
				createOrderInput({
					id: "order-2",
					now: "2026-10-02T11:01:00.000Z",
				}),
			),
		);
		await orders.save(
			Order.create(
				createOrderInput({
					id: "order-3",
					customerId: "customer-2",
					now: "2026-10-02T11:02:00.000Z",
				}),
			),
		);

		const firstPage = await new ListOrdersUseCase(orders).execute({
			customerId: "customer-1",
			limit: 1,
		});

		expect(firstPage.items.map((order) => order.id)).toEqual(["order-1"]);
		expect(firstPage.nextCursor).toBe("order-1");

		const secondPage = await new ListOrdersUseCase(orders).execute({
			customerId: "customer-1",
			limit: 1,
			cursor: firstPage.nextCursor,
		});

		expect(secondPage.items.map((order) => order.id)).toEqual(["order-2"]);
		expect(secondPage.nextCursor).toBeUndefined();
	});
});
