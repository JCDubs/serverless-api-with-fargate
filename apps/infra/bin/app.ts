#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { OrdersAuthStack } from "../lib/auth-stack";
import { resolveEnvironmentConfig } from "../lib/config";
import { OrdersStatefulStack } from "../lib/stateful-stack";
import { OrdersStatelessStack } from "../lib/stateless-stack";

const app = new cdk.App();
const environment = String(app.node.tryGetContext("env") ?? "dev");
const certificateArn = app.node.tryGetContext("certificateArn") as
	| string
	| undefined;
const config = resolveEnvironmentConfig(environment, certificateArn);
const tags = {
	Service: "orders",
	Environment: config.environment,
	Project: "serverless-api-with-fargate",
};

const auth = new OrdersAuthStack(app, "OrdersAuthStack", { config });
const stateful = new OrdersStatefulStack(app, "OrdersStatefulStack", {
	config,
});
const stateless = new OrdersStatelessStack(app, "OrdersStatelessStack", {
	config,
	auth,
	stateful,
	skipImageBuild: Boolean(app.node.tryGetContext("skipImageBuild")),
});

stateless.addStackDependency(auth);
stateless.addStackDependency(stateful);

for (const [key, value] of Object.entries(tags)) {
	cdk.Tags.of(app).add(key, value);
}

app.synth();
