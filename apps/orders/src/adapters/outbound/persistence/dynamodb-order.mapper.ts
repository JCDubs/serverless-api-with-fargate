import type { OrderProps } from "../../../domain/order";
import { Order } from "../../../domain/order";
import type { OrderStatus } from "../../../domain/order-status";

export const ORDER_SK = "ORDER";
export const IDEMPOTENCY_SK = "CREATE_ORDER";
export const ORDERS_GSI2_PK = "ORDERS";

export interface DynamoOrderItem {
	readonly pk: string;
	readonly sk: string;
	readonly gsi1pk: string;
	readonly gsi1sk: string;
	readonly gsi2pk: string;
	readonly gsi2sk: string;
	readonly entityType: "ORDER";
	readonly id: string;
	readonly customerId: string;
	readonly createdBy: string;
	readonly branchId: string;
	readonly comments: string;
	readonly status: OrderStatus;
	readonly totalAmount: number;
	readonly createdDateTime: string;
	readonly updatedDateTime: string;
	readonly version: number;
	readonly orderLines: OrderProps["orderLines"];
}

export interface DynamoIdempotencyItem {
	readonly pk: string;
	readonly sk: string;
	readonly entityType: "IDEMPOTENCY";
	readonly orderId: string;
	readonly ttl: number;
}

export function orderPk(orderId: string): string {
	return `ORDER#${orderId}`;
}

export function customerPk(customerId: string): string {
	return `CUSTOMER#${customerId}`;
}

export function idempotencyPk(key: string): string {
	return `IDEMPOTENCY#${key}`;
}

export function toDynamoOrderItem(order: Order): DynamoOrderItem {
	const props = order.toProps();
	return {
		pk: orderPk(props.id),
		sk: ORDER_SK,
		gsi1pk: customerPk(props.customerId),
		gsi1sk: `${props.createdDateTime}#${props.id}`,
		gsi2pk: ORDERS_GSI2_PK,
		gsi2sk: `${props.createdDateTime}#${props.id}`,
		entityType: "ORDER",
		...props,
	};
}

export function toOrder(item: DynamoOrderItem): Order {
	return Order.reconstitute({
		id: item.id,
		customerId: item.customerId,
		createdBy: item.createdBy,
		branchId: item.branchId,
		comments: item.comments,
		status: item.status,
		totalAmount: item.totalAmount,
		createdDateTime: item.createdDateTime,
		updatedDateTime: item.updatedDateTime,
		version: item.version,
		orderLines: item.orderLines,
	});
}

export function encodeCursor(key: Record<string, unknown>): string {
	return Buffer.from(JSON.stringify(key), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): Record<string, unknown> {
	return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
}
