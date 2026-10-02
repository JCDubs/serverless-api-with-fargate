import { CognitoJwtVerifier } from "aws-jwt-verify";

export interface AuthContext {
	readonly userId: string;
}

export interface Authenticator {
	authenticate(authorizationHeader?: string): Promise<AuthContext>;
}

export class DisabledAuthenticator implements Authenticator {
	constructor(private readonly userId = "local-user") {}

	async authenticate(): Promise<AuthContext> {
		return { userId: this.userId };
	}
}

export class CognitoAuthenticator implements Authenticator {
	private readonly verifier: ReturnType<typeof CognitoJwtVerifier.create>;

	constructor(userPoolId: string, clientId: string) {
		this.verifier = CognitoJwtVerifier.create({
			userPoolId,
			tokenUse: "id",
			clientId,
		});
	}

	async authenticate(authorizationHeader?: string): Promise<AuthContext> {
		const token = authorizationHeader?.replace(/^Bearer\s+/i, "");
		if (!token) {
			throw new Error("UNAUTHORIZED");
		}

		try {
			const payload = await this.verifier.verify(token);
			return { userId: String(payload.sub) };
		} catch {
			throw new Error("UNAUTHORIZED");
		}
	}
}
