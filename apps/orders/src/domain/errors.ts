export class DomainError extends Error {
	readonly code: string;

	constructor(code: string, message: string) {
		super(message);
		this.name = this.constructor.name;
		this.code = code;
	}
}

export class ValidationError extends DomainError {
	constructor(message: string) {
		super("VALIDATION_ERROR", message);
	}
}

export class InvalidOrderStateError extends DomainError {
	constructor(message: string) {
		super("INVALID_ORDER_STATE", message);
	}
}

export class OrderNotFoundError extends DomainError {
	constructor(orderId: string) {
		super("ORDER_NOT_FOUND", `Order ${orderId} was not found`);
	}
}

export class ConcurrencyError extends DomainError {
	constructor(orderId: string) {
		super(
			"CONCURRENCY_CONFLICT",
			`Order ${orderId} was modified by another request`,
		);
	}
}
