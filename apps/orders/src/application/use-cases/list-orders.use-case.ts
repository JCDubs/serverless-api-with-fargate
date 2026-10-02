import type {
	ListOrdersQuery,
	ListOrdersResult,
	OrderRepository,
} from "../ports/order.repository.port";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export class ListOrdersUseCase {
	constructor(private readonly orders: OrderRepository) {}

	async execute(query: {
		readonly customerId?: string;
		readonly limit?: number;
		readonly cursor?: string;
	}): Promise<ListOrdersResult> {
		const limit = Math.min(
			Math.max(query.limit ?? DEFAULT_LIMIT, 1),
			MAX_LIMIT,
		);

		return this.orders.list({
			customerId: query.customerId,
			limit,
			cursor: query.cursor,
		} satisfies ListOrdersQuery);
	}
}
