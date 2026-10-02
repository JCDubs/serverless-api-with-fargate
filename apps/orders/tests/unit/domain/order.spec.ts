import { describe, expect, it } from "vitest";
import { ValidationError } from "../../../src/domain/errors";
import { Order } from "../../../src/domain/order";
import { OrderStatus } from "../../../src/domain/order-status";
import { createOrderInput } from "../../support/order-fixtures";

describe("Order", () => {
	it("creates a pending order with generated totals and version 1", () => {
		const order = Order.create(
			createOrderInput({
				id: "order-1",
				now: "2026-10-02T11:00:00.000Z",
				orderLines: [
					{
						productId: "sku-1",
						productName: "Coffee",
						quantity: 2,
						price: 4.5,
					},
					{
						productId: "sku-2",
						productName: "Tea",
						quantity: 1,
						price: 3,
					},
				],
			}),
		);

		expect(order.id).toBe("order-1");
		expect(order.status).toBe(OrderStatus.PENDING);
		expect(order.totalAmount).toBe(12);
		expect(order.version).toBe(1);
		expect(order.orderLines).toHaveLength(2);
		expect(order.orderLines[0]?.total).toBe(9);
		expect(order.createdDateTime).toBe("2026-10-02T11:00:00.000Z");
		expect(order.updatedDateTime).toBe("2026-10-02T11:00:00.000Z");
	});

	it("rejects an order with no lines", () => {
		expect(() => Order.create(createOrderInput({ orderLines: [] }))).toThrow(
			ValidationError,
		);
	});

	it("rejects a non-positive quantity", () => {
		expect(() =>
			Order.create(
				createOrderInput({
					orderLines: [
						{
							productId: "sku-1",
							productName: "Coffee",
							quantity: 0,
							price: 4.5,
						},
					],
				}),
			),
		).toThrow(/quantity/);
	});

	it("rejects a negative price", () => {
		expect(() =>
			Order.create(
				createOrderInput({
					orderLines: [
						{
							productId: "sku-1",
							productName: "Coffee",
							quantity: 1,
							price: -1,
						},
					],
				}),
			),
		).toThrow(/price/);
	});

	it("rejects missing required identity fields", () => {
		expect(() => Order.create(createOrderInput({ customerId: "  " }))).toThrow(
			/customerId/,
		);
	});

	it("confirms a pending order and increments the version", () => {
		const confirmed = Order.create(createOrderInput()).confirm(
			"2026-10-02T12:00:00.000Z",
		);

		expect(confirmed.status).toBe(OrderStatus.CONFIRMED);
		expect(confirmed.version).toBe(2);
		expect(confirmed.updatedDateTime).toBe("2026-10-02T12:00:00.000Z");
	});

	it("does not allow shipping a pending order", () => {
		expect(() =>
			Order.create(createOrderInput()).ship("2026-10-02T12:00:00.000Z"),
		).toThrow(/SHIPPED/);
	});

	it("follows the happy-path lifecycle", () => {
		const delivered = Order.create(createOrderInput())
			.confirm("2026-10-02T12:00:00.000Z")
			.ship("2026-10-02T13:00:00.000Z")
			.deliver("2026-10-02T14:00:00.000Z");

		expect(delivered.status).toBe(OrderStatus.DELIVERED);
		expect(delivered.version).toBe(4);
	});

	it("cancels a pending or confirmed order", () => {
		const cancelled = Order.create(createOrderInput())
			.confirm("2026-10-02T12:00:00.000Z")
			.cancel("2026-10-02T12:30:00.000Z");

		expect(cancelled.status).toBe(OrderStatus.CANCELLED);
	});

	it("does not cancel a delivered order", () => {
		const delivered = Order.create(createOrderInput())
			.confirm("2026-10-02T12:00:00.000Z")
			.ship("2026-10-02T13:00:00.000Z")
			.deliver("2026-10-02T14:00:00.000Z");

		expect(() => delivered.cancel("2026-10-02T15:00:00.000Z")).toThrow(
			/CANCELLED/,
		);
	});

	it("updates comments and lines only while pending", () => {
		const updated = Order.create(createOrderInput()).update({
			comments: "leave at reception",
			orderLines: [
				{
					productId: "sku-9",
					productName: "Mug",
					quantity: 1,
					price: 12,
				},
			],
			now: "2026-10-02T11:05:00.000Z",
		});

		expect(updated.comments).toBe("leave at reception");
		expect(updated.totalAmount).toBe(12);
		expect(updated.version).toBe(2);

		expect(() =>
			updated.confirm("2026-10-02T12:00:00.000Z").update({
				comments: "too late",
				now: "2026-10-02T12:01:00.000Z",
			}),
		).toThrow(/PENDING/);
	});

	it("reconstitutes a persisted order without changing version", () => {
		const created = Order.create(createOrderInput({ id: "order-9" }));
		const restored = Order.reconstitute(created.toProps());

		expect(restored).toEqual(created);
		expect(restored.version).toBe(1);
	});
});
