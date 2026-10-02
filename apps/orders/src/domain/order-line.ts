import { randomUUID } from "node:crypto";
import {
	money,
	nonEmptyString,
	optionalString,
	positiveInteger,
} from "./validation";

export interface CreateOrderLineInput {
	readonly id?: string;
	readonly productId: string;
	readonly productName: string;
	readonly quantity: number;
	readonly price: number;
}

export interface OrderLineProps {
	readonly id: string;
	readonly productId: string;
	readonly productName: string;
	readonly quantity: number;
	readonly price: number;
	readonly total: number;
}

export class OrderLine {
	readonly id: string;
	readonly productId: string;
	readonly productName: string;
	readonly quantity: number;
	readonly price: number;
	readonly total: number;

	private constructor(props: OrderLineProps) {
		this.id = props.id;
		this.productId = props.productId;
		this.productName = props.productName;
		this.quantity = props.quantity;
		this.price = props.price;
		this.total = props.total;
	}

	static create(input: CreateOrderLineInput): OrderLine {
		const quantity = positiveInteger(input.quantity, "quantity");
		const price = money(input.price, "price");

		return new OrderLine({
			id: optionalString(input.id, "id") || randomUUID(),
			productId: nonEmptyString(input.productId, "productId"),
			productName: nonEmptyString(input.productName, "productName"),
			quantity,
			price,
			total: Math.round(quantity * price * 100) / 100,
		});
	}

	static reconstitute(props: OrderLineProps): OrderLine {
		return new OrderLine(props);
	}

	toProps(): OrderLineProps {
		return {
			id: this.id,
			productId: this.productId,
			productName: this.productName,
			quantity: this.quantity,
			price: this.price,
			total: this.total,
		};
	}
}
