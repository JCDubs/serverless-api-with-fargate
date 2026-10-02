import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { OrdersAuthStack } from "../lib/auth-stack";
import { resolveEnvironmentConfig } from "../lib/config";
import { OrdersStatefulStack } from "../lib/stateful-stack";
import { OrdersStatelessStack } from "../lib/stateless-stack";

function synthesize(environment: "dev" | "prod") {
	const app = new cdk.App();
	const config = resolveEnvironmentConfig(environment);
	const auth = new OrdersAuthStack(app, "OrdersAuthStack", { config });
	const stateful = new OrdersStatefulStack(app, "OrdersStatefulStack", {
		config,
	});
	const stateless = new OrdersStatelessStack(app, "OrdersStatelessStack", {
		config,
		auth,
		stateful,
		skipImageBuild: true,
	});

	return {
		auth: Template.fromStack(auth),
		stateful: Template.fromStack(stateful),
		stateless: Template.fromStack(stateless),
	};
}

describe("Orders infrastructure", () => {
	it("places Fargate tasks in private subnets without public IPs", () => {
		const { stateless } = synthesize("prod");

		stateless.hasResourceProperties("AWS::ECS::Service", {
			NetworkConfiguration: {
				AwsvpcConfiguration: {
					AssignPublicIp: "DISABLED",
				},
			},
			EnableExecuteCommand: true,
			DesiredCount: 2,
		});
	});

	it("creates a multi-AZ VPC with DynamoDB gateway endpoint", () => {
		const { stateful } = synthesize("prod");
		const template = stateful.toJSON();
		const subnets = Object.values(template.Resources).filter(
			(resource) => (resource as { Type?: string }).Type === "AWS::EC2::Subnet",
		);

		expect(subnets.length).toBeGreaterThanOrEqual(4);
		stateful.hasResourceProperties("AWS::EC2::VPCEndpoint", {
			ServiceName: {
				"Fn::Join": [
					"",
					["com.amazonaws.", { Ref: "AWS::Region" }, ".dynamodb"],
				],
			},
		});
	});

	it("uses DynamoDB and EventBridge for supporting persistence and events", () => {
		const { stateful } = synthesize("dev");

		stateful.hasResourceProperties("AWS::DynamoDB::Table", {
			BillingMode: "PAY_PER_REQUEST",
			KeySchema: Match.arrayWith([
				Match.objectLike({ AttributeName: "pk", KeyType: "HASH" }),
				Match.objectLike({ AttributeName: "sk", KeyType: "RANGE" }),
			]),
		});
		stateful.hasResourceProperties("AWS::Events::EventBus", {
			Name: "orders-dev",
		});
	});

	it("creates a Cognito user pool in the auth stack", () => {
		const { auth } = synthesize("dev");
		auth.hasResourceProperties("AWS::Cognito::UserPool", {
			UserPoolName: "orders-dev",
		});
	});

	it("uses a single NAT gateway in non-production environments", () => {
		const { stateful } = synthesize("dev");
		const template = stateful.toJSON();
		const nats = Object.values(template.Resources).filter(
			(resource) =>
				(resource as { Type?: string }).Type === "AWS::EC2::NatGateway",
		);

		expect(nats).toHaveLength(1);
	});
});
