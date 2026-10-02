import { z } from "zod";
import type { Order } from "../../../domain/order";
import { OrderStatus } from "../../../domain/order-status";

const orderLineSchema = z.object({
	productId: z.string().min(1),
	productName: z.string().min(1),
	quantity: z.number().int().positive(),
	price: z.number().nonnegative(),
});

export const createOrderBodySchema = z.object({
	customerId: z.string().min(1),
	branchId: z.string().min(1),
	comments: z.string().optional(),
	orderLines: z.array(orderLineSchema).min(1),
});

export const updateOrderBodySchema = z.object({
	version: z.number().int().positive(),
	comments: z.string().optional(),
	orderLines: z.array(orderLineSchema).min(1).optional(),
	status: z
		.enum([
			OrderStatus.PENDING,
			OrderStatus.CONFIRMED,
			OrderStatus.SHIPPED,
			OrderStatus.DELIVERED,
			OrderStatus.CANCELLED,
		])
		.optional(),
});

export const listOrdersQuerySchema = z.object({
	customerId: z.string().min(1).optional(),
	limit: z.coerce.number().int().positive().max(100).optional(),
	cursor: z.string().min(1).optional(),
});

export const cancelOrderQuerySchema = z.object({
	version: z.coerce.number().int().positive(),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
export type UpdateOrderBody = z.infer<typeof updateOrderBodySchema>;

export function toOrderResponse(order: Order) {
	return {
		id: order.id,
		customerId: order.customerId,
		createdBy: order.createdBy,
		branchId: order.branchId,
		comments: order.comments,
		status: order.status,
		totalAmount: order.totalAmount,
		createdDateTime: order.createdDateTime,
		updatedDateTime: order.updatedDateTime,
		version: order.version,
		orderLines: order.orderLines.map((line) => ({
			id: line.id,
			productId: line.productId,
			productName: line.productName,
			quantity: line.quantity,
			price: line.price,
			total: line.total,
		})),
	};
}
