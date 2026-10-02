import { OrderNotFoundError } from "../../domain/errors";
import type { Order } from "../../domain/order";
import type { OrderRepository } from "../ports/order.repository.port";

export class GetOrderUseCase {
	constructor(private readonly orders: OrderRepository) {}

	async execute(orderId: string): Promise<Order> {
		const order = await this.orders.getById(orderId);
		if (!order) {
			throw new OrderNotFoundError(orderId);
		}

		return order;
	}
}
