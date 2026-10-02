import { ZodError } from "zod";
import { DomainError } from "../../../domain/errors";

export interface ApiErrorBody {
	error: {
		code: string;
		message: string;
		correlationId: string;
	};
}

const statusByCode: Record<string, number> = {
	VALIDATION_ERROR: 400,
	UNAUTHORIZED: 401,
	ORDER_NOT_FOUND: 404,
	INVALID_ORDER_STATE: 409,
	CONCURRENCY_CONFLICT: 409,
};

export function mapError(
	error: unknown,
	correlationId: string,
): { statusCode: number; body: ApiErrorBody } {
	if (error instanceof ZodError) {
		return {
			statusCode: 400,
			body: {
				error: {
					code: "VALIDATION_ERROR",
					message: error.issues.map((issue) => issue.message).join("; "),
					correlationId,
				},
			},
		};
	}

	if (error instanceof DomainError) {
		return {
			statusCode: statusByCode[error.code] ?? 400,
			body: {
				error: {
					code: error.code,
					message: error.message,
					correlationId,
				},
			},
		};
	}

	if (error instanceof Error && error.message === "UNAUTHORIZED") {
		return {
			statusCode: 401,
			body: {
				error: {
					code: "UNAUTHORIZED",
					message: "Authentication is required",
					correlationId,
				},
			},
		};
	}

	return {
		statusCode: 500,
		body: {
			error: {
				code: "INTERNAL_ERROR",
				message: "An unexpected error occurred",
				correlationId,
			},
		},
	};
}
