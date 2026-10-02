import {
	ConditionalCheckFailedException,
	DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand,
	QueryCommand,
	TransactWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import type {
	ListOrdersQuery,
	ListOrdersResult,
	OrderRepository,
} from "../../../application/ports/order.repository.port";
import { ConcurrencyError } from "../../../domain/errors";
import type { Order } from "../../../domain/order";
import {
	customerPk,
	type DynamoIdempotencyItem,
	type DynamoOrderItem,
	decodeCursor,
	encodeCursor,
	IDEMPOTENCY_SK,
	idempotencyPk,
	ORDER_SK,
	ORDERS_GSI2_PK,
	orderPk,
	toDynamoOrderItem,
	toOrder,
} from "./dynamodb-order.mapper";

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60;

export class DynamoDbOrderRepository implements OrderRepository {
	private readonly document: DynamoDBDocumentClient;

	constructor(
		private readonly tableName: string,
		client: DynamoDBClient | DynamoDBDocumentClient = new DynamoDBClient({}),
	) {
		this.document =
			client instanceof DynamoDBDocumentClient
				? client
				: DynamoDBDocumentClient.from(client, {
						marshallOptions: { removeUndefinedValues: true },
					});
	}

	async save(order: Order, idempotencyKey?: string): Promise<Order> {
		const item = toDynamoOrderItem(order);

		if (!idempotencyKey) {
			await this.document.send(
				new PutCommand({
					TableName: this.tableName,
					Item: item,
					ConditionExpression: "attribute_not_exists(pk)",
				}),
			);
			return order;
		}

		const ttl = Math.floor(Date.now() / 1000) + IDEMPOTENCY_TTL_SECONDS;
		const idempotencyItem: DynamoIdempotencyItem = {
			pk: idempotencyPk(idempotencyKey),
			sk: IDEMPOTENCY_SK,
			entityType: "IDEMPOTENCY",
			orderId: order.id,
			ttl,
		};

		try {
			await this.document.send(
				new TransactWriteCommand({
					TransactItems: [
						{
							Put: {
								TableName: this.tableName,
								Item: idempotencyItem,
								ConditionExpression: "attribute_not_exists(pk)",
							},
						},
						{
							Put: {
								TableName: this.tableName,
								Item: item,
								ConditionExpression: "attribute_not_exists(pk)",
							},
						},
					],
				}),
			);
			return order;
		} catch (error) {
			const existing = await this.findByIdempotencyKey(idempotencyKey);
			if (existing) {
				return existing;
			}
			throw error;
		}
	}

	async update(order: Order, expectedVersion: number): Promise<Order> {
		try {
			await this.document.send(
				new PutCommand({
					TableName: this.tableName,
					Item: toDynamoOrderItem(order),
					ConditionExpression: "version = :expectedVersion",
					ExpressionAttributeValues: {
						":expectedVersion": expectedVersion,
					},
				}),
			);
			return order;
		} catch (error) {
			if (error instanceof ConditionalCheckFailedException) {
				throw new ConcurrencyError(order.id);
			}
			throw error;
		}
	}

	async getById(orderId: string): Promise<Order | undefined> {
		const result = await this.document.send(
			new GetCommand({
				TableName: this.tableName,
				Key: { pk: orderPk(orderId), sk: ORDER_SK },
			}),
		);

		return result.Item ? toOrder(result.Item as DynamoOrderItem) : undefined;
	}

	async list(query: ListOrdersQuery): Promise<ListOrdersResult> {
		const exclusiveStartKey = query.cursor
			? decodeCursor(query.cursor)
			: undefined;

		const result = query.customerId
			? await this.document.send(
					new QueryCommand({
						TableName: this.tableName,
						IndexName: "gsi1",
						KeyConditionExpression: "gsi1pk = :pk",
						ExpressionAttributeValues: {
							":pk": customerPk(query.customerId),
						},
						Limit: query.limit,
						ExclusiveStartKey: exclusiveStartKey,
					}),
				)
			: await this.document.send(
					new QueryCommand({
						TableName: this.tableName,
						IndexName: "gsi2",
						KeyConditionExpression: "gsi2pk = :pk",
						ExpressionAttributeValues: {
							":pk": ORDERS_GSI2_PK,
						},
						Limit: query.limit,
						ExclusiveStartKey: exclusiveStartKey,
					}),
				);

		return {
			items: (result.Items ?? []).map((item) =>
				toOrder(item as DynamoOrderItem),
			),
			nextCursor: result.LastEvaluatedKey
				? encodeCursor(result.LastEvaluatedKey)
				: undefined,
		};
	}

	async findByIdempotencyKey(
		idempotencyKey: string,
	): Promise<Order | undefined> {
		const result = await this.document.send(
			new GetCommand({
				TableName: this.tableName,
				Key: { pk: idempotencyPk(idempotencyKey), sk: IDEMPOTENCY_SK },
			}),
		);

		const item = result.Item as DynamoIdempotencyItem | undefined;
		if (!item) {
			return undefined;
		}

		return this.getById(item.orderId);
	}
}
