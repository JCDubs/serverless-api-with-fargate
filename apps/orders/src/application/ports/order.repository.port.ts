import type { Order } from "../../domain/order";

export interface ListOrdersQuery {
	readonly customerId?: string;
	readonly limit: number;
	readonly cursor?: string;
}

export interface ListOrdersResult {
	readonly items: readonly Order[];
	readonly nextCursor?: string;
}

export interface OrderRepository {
	save(order: Order, idempotencyKey?: string): Promise<Order>;
	update(order: Order, expectedVersion: number): Promise<Order>;
	getById(orderId: string): Promise<Order | undefined>;
	list(query: ListOrdersQuery): Promise<ListOrdersResult>;
	findByIdempotencyKey(idempotencyKey: string): Promise<Order | undefined>;
}
