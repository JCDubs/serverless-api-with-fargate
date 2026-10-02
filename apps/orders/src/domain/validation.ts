import { ValidationError } from "./errors";

export function nonEmptyString(value: string, field: string): string {
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new ValidationError(`${field} must be a non-empty string`);
	}

	return value.trim();
}

export function optionalString(
	value: string | undefined,
	field: string,
): string {
	if (value === undefined || value === "") {
		return "";
	}

	if (typeof value !== "string") {
		throw new ValidationError(`${field} must be a string`);
	}

	return value.trim();
}

export function positiveInteger(value: number, field: string): number {
	if (!Number.isInteger(value) || value <= 0) {
		throw new ValidationError(`${field} must be a positive integer`);
	}

	return value;
}

export function money(value: number, field: string): number {
	if (!Number.isFinite(value) || value < 0) {
		throw new ValidationError(`${field} must be a non-negative number`);
	}

	const rounded = Math.round(value * 100) / 100;
	if (Math.abs(rounded - value) > 1e-8) {
		throw new ValidationError(`${field} must have at most two decimal places`);
	}

	return rounded;
}

export function isoDateTime(value: string, field: string): string {
	const parsed = Date.parse(value);
	if (Number.isNaN(parsed) || new Date(value).toISOString() !== value) {
		throw new ValidationError(`${field} must be an ISO-8601 UTC timestamp`);
	}

	return value;
}
