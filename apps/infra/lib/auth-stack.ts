import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import type { Construct } from "constructs";
import type { EnvironmentConfig } from "./config";

export class OrdersAuthStack extends cdk.Stack {
	readonly userPool: cognito.UserPool;
	readonly userPoolClient: cognito.UserPoolClient;

	constructor(
		scope: Construct,
		id: string,
		props: cdk.StackProps & { readonly config: EnvironmentConfig },
	) {
		super(scope, id, props);

		this.userPool = new cognito.UserPool(this, "OrdersUserPool", {
			userPoolName: `orders-${props.config.environment}`,
			selfSignUpEnabled: false,
			signInAliases: { email: true, username: true },
			passwordPolicy: {
				minLength: 12,
				requireDigits: true,
				requireLowercase: true,
				requireSymbols: true,
				requireUppercase: true,
			},
			accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
			removalPolicy: props.config.retainStatefulResources
				? cdk.RemovalPolicy.RETAIN
				: cdk.RemovalPolicy.DESTROY,
		});

		this.userPoolClient = this.userPool.addClient("OrdersUserPoolClient", {
			userPoolClientName: `orders-${props.config.environment}-api`,
			authFlows: {
				userPassword: true,
				userSrp: true,
			},
			generateSecret: false,
			preventUserExistenceErrors: true,
		});

		new cdk.CfnOutput(this, "UserPoolId", {
			value: this.userPool.userPoolId,
		});
		new cdk.CfnOutput(this, "UserPoolClientId", {
			value: this.userPoolClient.userPoolClientId,
		});
		new cdk.CfnOutput(this, "Issuer", {
			value: `https://cognito-idp.${this.region}.amazonaws.com/${this.userPool.userPoolId}`,
		});
	}
}
