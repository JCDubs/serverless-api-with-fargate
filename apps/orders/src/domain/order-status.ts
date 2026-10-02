export const OrderStatus = {
	PENDING: "PENDING",
	CONFIRMED: "CONFIRMED",
	SHIPPED: "SHIPPED",
	DELIVERED: "DELIVERED",
	CANCELLED: "CANCELLED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

const allowedTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
	PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
	CONFIRMED: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
	SHIPPED: [OrderStatus.DELIVERED],
	DELIVERED: [],
	CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
	return allowedTransitions[from].includes(to);
}
