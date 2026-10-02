import type { CreateOrderInput } from "../../src/domain/order";

export function createOrderInput(
	overrides: Partial<CreateOrderInput> = {},
): CreateOrderInput {
	return {
		id: "order-1",
		customerId: "customer-1",
		createdBy: "user-1",
		branchId: "branch-1",
		comments: "handle with care",
		now: "2026-10-02T11:00:00.000Z",
		orderLines: [
			{
				productId: "sku-1",
				productName: "Coffee",
				quantity: 2,
				price: 4.5,
			},
		],
		...overrides,
	};
}
