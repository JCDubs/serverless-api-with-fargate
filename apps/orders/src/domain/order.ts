import { InvalidOrderStateError, ValidationError } from "./errors";
import {
	type CreateOrderLineInput,
	OrderLine,
	type OrderLineProps,
} from "./order-line";
import { canTransition, OrderStatus } from "./order-status";
import { isoDateTime, nonEmptyString, optionalString } from "./validation";

export interface CreateOrderInput {
	readonly id: string;
	readonly customerId: string;
	readonly createdBy: string;
	readonly branchId: string;
	readonly comments?: string;
	readonly now: string;
	readonly orderLines: readonly CreateOrderLineInput[];
}

export interface UpdateOrderInput {
	readonly comments?: string;
	readonly orderLines?: readonly CreateOrderLineInput[];
	readonly now: string;
}

export interface OrderProps {
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
	readonly orderLines: readonly OrderLineProps[];
}

export class Order {
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
	readonly orderLines: readonly OrderLine[];

	private constructor(props: {
		readonly id: string;
		readonly customerId: string;
		readonly createdBy: string;
		readonly branchId: string;
		readonly comments: string;
		readonly status: OrderStatus;
		readonly createdDateTime: string;
		readonly updatedDateTime: string;
		readonly version: number;
		readonly orderLines: readonly OrderLine[];
	}) {
		this.id = props.id;
		this.customerId = props.customerId;
		this.createdBy = props.createdBy;
		this.branchId = props.branchId;
		this.comments = props.comments;
		this.status = props.status;
		this.createdDateTime = props.createdDateTime;
		this.updatedDateTime = props.updatedDateTime;
		this.version = props.version;
		this.orderLines = props.orderLines;
		this.totalAmount =
			Math.round(
				props.orderLines.reduce((sum, line) => sum + line.total, 0) * 100,
			) / 100;
	}

	static create(input: CreateOrderInput): Order {
		const validated = Order.validate(input);
		const orderLines = validated.orderLines.map((line) =>
			OrderLine.create(line),
		);

		if (orderLines.length === 0) {
			throw new ValidationError("orderLines must contain at least one line");
		}

		return new Order({
			id: validated.id,
			customerId: validated.customerId,
			createdBy: validated.createdBy,
			branchId: validated.branchId,
			comments: validated.comments,
			status: OrderStatus.PENDING,
			createdDateTime: validated.now,
			updatedDateTime: validated.now,
			version: 1,
			orderLines,
		});
	}

	static validate(input: CreateOrderInput): {
		id: string;
		customerId: string;
		createdBy: string;
		branchId: string;
		comments: string;
		now: string;
		orderLines: readonly CreateOrderLineInput[];
	} {
		return {
			id: nonEmptyString(input.id, "id"),
			customerId: nonEmptyString(input.customerId, "customerId"),
			createdBy: nonEmptyString(input.createdBy, "createdBy"),
			branchId: nonEmptyString(input.branchId, "branchId"),
			comments: optionalString(input.comments, "comments"),
			now: isoDateTime(input.now, "now"),
			orderLines: input.orderLines,
		};
	}

	static reconstitute(props: OrderProps): Order {
		return new Order({
			...props,
			orderLines: props.orderLines.map((line) => OrderLine.reconstitute(line)),
		});
	}

	confirm(now: string): Order {
		return this.transition(OrderStatus.CONFIRMED, now);
	}

	ship(now: string): Order {
		return this.transition(OrderStatus.SHIPPED, now);
	}

	deliver(now: string): Order {
		return this.transition(OrderStatus.DELIVERED, now);
	}

	cancel(now: string): Order {
		return this.transition(OrderStatus.CANCELLED, now);
	}

	update(input: UpdateOrderInput): Order {
		if (this.status !== OrderStatus.PENDING) {
			throw new InvalidOrderStateError(
				"Order details can only be updated while the order is PENDING",
			);
		}

		const orderLines = (
			input.orderLines ?? this.orderLines.map((line) => line.toProps())
		).map((line) => OrderLine.create(line));

		if (orderLines.length === 0) {
			throw new ValidationError("orderLines must contain at least one line");
		}

		return new Order({
			id: this.id,
			customerId: this.customerId,
			createdBy: this.createdBy,
			branchId: this.branchId,
			comments:
				input.comments === undefined
					? this.comments
					: optionalString(input.comments, "comments"),
			status: this.status,
			createdDateTime: this.createdDateTime,
			updatedDateTime: isoDateTime(input.now, "now"),
			version: this.version + 1,
			orderLines,
		});
	}

	toProps(): OrderProps {
		return {
			id: this.id,
			customerId: this.customerId,
			createdBy: this.createdBy,
			branchId: this.branchId,
			comments: this.comments,
			status: this.status,
			totalAmount: this.totalAmount,
			createdDateTime: this.createdDateTime,
			updatedDateTime: this.updatedDateTime,
			version: this.version,
			orderLines: this.orderLines.map((line) => line.toProps()),
		};
	}

	private transition(nextStatus: OrderStatus, now: string): Order {
		if (!canTransition(this.status, nextStatus)) {
			throw new InvalidOrderStateError(
				`Order cannot transition from ${this.status} to ${nextStatus}`,
			);
		}

		return new Order({
			id: this.id,
			customerId: this.customerId,
			createdBy: this.createdBy,
			branchId: this.branchId,
			comments: this.comments,
			status: nextStatus,
			createdDateTime: this.createdDateTime,
			updatedDateTime: isoDateTime(now, "now"),
			version: this.version + 1,
			orderLines: this.orderLines,
		});
	}
}
