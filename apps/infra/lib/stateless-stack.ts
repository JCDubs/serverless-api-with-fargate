import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import type { Construct } from "constructs";
import type { OrdersAuthStack } from "./auth-stack";
import type { EnvironmentConfig } from "./config";
import type { OrdersStatefulStack } from "./stateful-stack";

export interface OrdersStatelessStackProps extends cdk.StackProps {
	readonly config: EnvironmentConfig;
	readonly auth: OrdersAuthStack;
	readonly stateful: OrdersStatefulStack;
	readonly skipImageBuild?: boolean;
}

export class OrdersStatelessStack extends cdk.Stack {
	readonly service: ecs_patterns.ApplicationLoadBalancedFargateService;

	constructor(scope: Construct, id: string, props: OrdersStatelessStackProps) {
		super(scope, id, props);

		const cluster = new ecs.Cluster(this, "OrdersCluster", {
			vpc: props.stateful.vpc,
			containerInsightsV2: ecs.ContainerInsights.ENABLED,
			clusterName: `orders-${props.config.environment}`,
		});

		const image = props.skipImageBuild
			? ecs.ContainerImage.fromRegistry(
					"public.ecr.aws/docker/library/node:22-alpine",
				)
			: ecs.ContainerImage.fromAsset(path.join(__dirname, "../../.."), {
					file: "apps/orders/Dockerfile",
					platform: ecr_assets.Platform.LINUX_AMD64,
				});

		this.service = new ecs_patterns.ApplicationLoadBalancedFargateService(
			this,
			"OrdersService",
			{
				cluster,
				desiredCount: props.config.desiredCount,
				cpu: props.config.cpu,
				memoryLimitMiB: props.config.memoryLimitMiB,
				publicLoadBalancer: true,
				assignPublicIp: false,
				taskSubnets: {
					subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
				},
				enableExecuteCommand: true,
				circuitBreaker: { rollback: true },
				minHealthyPercent: 100,
				maxHealthyPercent: 200,
				certificate: props.config.certificateArn
					? certificatemanager.Certificate.fromCertificateArn(
							this,
							"OrdersCertificate",
							props.config.certificateArn,
						)
					: undefined,
				redirectHTTP: Boolean(props.config.certificateArn),
				listenerPort: props.config.certificateArn ? 443 : 80,
				taskImageOptions: {
					image,
					containerPort: 3000,
					family: `orders-${props.config.environment}`,
					logDriver: ecs.LogDrivers.awsLogs({
						streamPrefix: "orders",
						logRetention: logs.RetentionDays.ONE_MONTH,
					}),
					environment: {
						NODE_ENV: "production",
						PORT: "3000",
						ORDER_STORE: "dynamodb",
						EVENT_BUS: "eventbridge",
						TABLE_NAME: props.stateful.table.tableName,
						EVENT_BUS_NAME: props.stateful.eventBus.eventBusName,
						AWS_REGION: this.region,
						AUTH_DISABLED: "false",
						COGNITO_USER_POOL_ID: props.auth.userPool.userPoolId,
						COGNITO_CLIENT_ID: props.auth.userPoolClient.userPoolClientId,
					},
				},
			},
		);

		this.service.targetGroup.configureHealthCheck({
			path: "/health",
			healthyHttpCodes: "200",
			interval: cdk.Duration.seconds(30),
		});

		props.stateful.table.grantReadWriteData(
			this.service.taskDefinition.taskRole,
		);
		props.stateful.eventBus.grantPutEventsTo(
			this.service.taskDefinition.taskRole,
		);

		this.service.taskDefinition.taskRole.addToPrincipalPolicy(
			new iam.PolicyStatement({
				sid: "EcsExec",
				actions: [
					"ssmmessages:CreateControlChannel",
					"ssmmessages:CreateDataChannel",
					"ssmmessages:OpenControlChannel",
					"ssmmessages:OpenDataChannel",
				],
				resources: ["*"],
			}),
		);

		const scaling = this.service.service.autoScaleTaskCount({
			minCapacity: props.config.minCapacity,
			maxCapacity: props.config.maxCapacity,
		});
		scaling.scaleOnCpuUtilization("CpuScaling", {
			targetUtilizationPercent: props.config.cpuTargetUtilization,
		});

		new cloudwatch.Alarm(this, "UnhealthyHostsAlarm", {
			metric: this.service.targetGroup.metrics.unhealthyHostCount(),
			threshold: 1,
			evaluationPeriods: 2,
			alarmDescription: "Orders ALB has unhealthy hosts",
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		new cloudwatch.Alarm(this, "Alb5xxAlarm", {
			metric: this.service.loadBalancer.metrics.httpCodeElb(
				elbv2.HttpCodeElb.ELB_5XX_COUNT,
			),
			threshold: 5,
			evaluationPeriods: 1,
			alarmDescription: "Orders ALB is returning 5xx errors",
			treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
		});

		new cdk.CfnOutput(this, "LoadBalancerDns", {
			value: this.service.loadBalancer.loadBalancerDnsName,
		});
	}
}
