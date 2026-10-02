export interface LogFields {
	readonly [key: string]: unknown;
}

export interface Logger {
	info(message: string, fields?: LogFields): void;
	warn(message: string, fields?: LogFields): void;
	error(message: string, fields?: LogFields): void;
}

export class ConsoleLogger implements Logger {
	constructor(private readonly serviceName = "orders") {}

	info(message: string, fields: LogFields = {}): void {
		this.write("INFO", message, fields);
	}

	warn(message: string, fields: LogFields = {}): void {
		this.write("WARN", message, fields);
	}

	error(message: string, fields: LogFields = {}): void {
		this.write("ERROR", message, fields);
	}

	private write(level: string, message: string, fields: LogFields): void {
		const record = {
			timestamp: new Date().toISOString(),
			level,
			service: this.serviceName,
			message,
			...sanitize(fields),
		};
		const line = JSON.stringify(record);
		if (level === "ERROR") {
			console.error(line);
			return;
		}
		console.log(line);
	}
}

const sensitive = /secret|token|password|authorization|key/i;

function sanitize(fields: LogFields): LogFields {
	return Object.fromEntries(
		Object.entries(fields).filter(([key]) => !sensitive.test(key)),
	);
}
