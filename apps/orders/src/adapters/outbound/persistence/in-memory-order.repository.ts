import type {
	ListOrdersQuery,
	ListOrdersResult,
	OrderRepository,
} from "../../../application/ports/order.repository.port";
import { ConcurrencyError } from "../../../domain/errors";
import type { Order } from "../../../domain/order";

export class InMemoryOrderRepository implements OrderRepository {
	private readonly orders = new Map<string, Order>();
	private readonly idempotency = new Map<string, string>();

	async save(order: Order, idempotencyKey?: string): Promise<Order> {
		if (idempotencyKey) {
			const existingId = this.idempotency.get(idempotencyKey);
			if (existingId) {
				const existing = this.orders.get(existingId);
				if (existing) {
					return existing;
				}
			}
			this.idempotency.set(idempotencyKey, order.id);
		}

		this.orders.set(order.id, order);
		return order;
	}

	async update(order: Order, expectedVersion: number): Promise<Order> {
		const current = this.orders.get(order.id);
		if (!current || current.version !== expectedVersion) {
			throw new ConcurrencyError(order.id);
		}

		this.orders.set(order.id, order);
		return order;
	}

	async getById(orderId: string): Promise<Order | undefined> {
		return this.orders.get(orderId);
	}

	async list(query: ListOrdersQuery): Promise<ListOrdersResult> {
		const sorted = [...this.orders.values()]
			.filter((order) =>
				query.customerId ? order.customerId === query.customerId : true,
			)
			.sort((left, right) =>
				left.createdDateTime === right.createdDateTime
					? left.id.localeCompare(right.id)
					: left.createdDateTime.localeCompare(right.createdDateTime),
			);

		const start = query.cursor
			? sorted.findIndex((order) => order.id === query.cursor) + 1
			: 0;
		const items = sorted.slice(start, start + query.limit);
		const last = items.at(-1);
		const hasMore = start + items.length < sorted.length;

		return {
			items,
			nextCursor: hasMore && last ? last.id : undefined,
		};
	}

	async findByIdempotencyKey(
		idempotencyKey: string,
	): Promise<Order | undefined> {
		const orderId = this.idempotency.get(idempotencyKey);
		return orderId ? this.orders.get(orderId) : undefined;
	}
}
