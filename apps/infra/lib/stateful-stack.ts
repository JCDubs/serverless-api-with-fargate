import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as events from "aws-cdk-lib/aws-events";
import type { Construct } from "constructs";
import type { EnvironmentConfig } from "./config";

export class OrdersStatefulStack extends cdk.Stack {
	readonly vpc: ec2.Vpc;
	readonly table: dynamodb.Table;
	readonly eventBus: events.EventBus;

	constructor(
		scope: Construct,
		id: string,
		props: cdk.StackProps & { readonly config: EnvironmentConfig },
	) {
		super(scope, id, props);

		this.vpc = new ec2.Vpc(this, "OrdersVpc", {
			maxAzs: 2,
			natGateways: props.config.natGateways,
			subnetConfiguration: [
				{
					name: "public",
					subnetType: ec2.SubnetType.PUBLIC,
					cidrMask: 24,
				},
				{
					name: "private-application",
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
					cidrMask: 24,
				},
			],
		});

		this.vpc.addGatewayEndpoint("DynamoDbEndpoint", {
			service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
		});

		this.table = new dynamodb.Table(this, "OrdersTable", {
			tableName: `orders-${props.config.environment}`,
			partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "sk", type: dynamodb.AttributeType.STRING },
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			encryption: dynamodb.TableEncryption.AWS_MANAGED,
			pointInTimeRecoverySpecification: {
				pointInTimeRecoveryEnabled: props.config.pointInTimeRecovery,
			},
			timeToLiveAttribute: "ttl",
			removalPolicy: props.config.retainStatefulResources
				? cdk.RemovalPolicy.RETAIN
				: cdk.RemovalPolicy.DESTROY,
		});

		this.table.addGlobalSecondaryIndex({
			indexName: "gsi1",
			partitionKey: { name: "gsi1pk", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "gsi1sk", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		this.table.addGlobalSecondaryIndex({
			indexName: "gsi2",
			partitionKey: { name: "gsi2pk", type: dynamodb.AttributeType.STRING },
			sortKey: { name: "gsi2sk", type: dynamodb.AttributeType.STRING },
			projectionType: dynamodb.ProjectionType.ALL,
		});

		this.eventBus = new events.EventBus(this, "OrdersEventBus", {
			eventBusName: `orders-${props.config.environment}`,
		});

		new cdk.CfnOutput(this, "TableName", { value: this.table.tableName });
		new cdk.CfnOutput(this, "EventBusName", {
			value: this.eventBus.eventBusName,
		});
		new cdk.CfnOutput(this, "VpcId", { value: this.vpc.vpcId });
	}
}
