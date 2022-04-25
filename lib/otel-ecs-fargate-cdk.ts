import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';



export class otelEcsFargateCdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    //const executionRole = iam.Role.fromRoleArn(this,'executionrole','arn:',{});

    //const taskRole = iam.Role.fromRoleArn(this,'taskrole','arn:',{});

    const executionRole = new iam.Role(this,'ecsTaskExecutionRole',{
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    }
    )


    executionRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"));


    const taskRole = new iam.Role(this,'adotTaskRole',{
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    }
    )

    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonPrometheusRemoteWriteAccess"));

    taskRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AWSXrayWriteOnlyAccess"));


    const appLogGroup = new logs.LogGroup(this, 'appLogGroup', {
        logGroupName: '/ecs/otel-app',
    });

    const adotLogGroup = new logs.LogGroup(this, 'adotLogGroup', {
        logGroupName: '/ecs/ecs-adot-collector',
    });

    const promLogGroup = new logs.LogGroup(this, 'promLogGroup', {
      logGroupName: '/ecs/ecs-prom',
    });

    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
      },
      memoryLimitMiB: 1024,
      cpu: 256,
      executionRole: executionRole,
      taskRole: taskRole
    });

    const container = fargateTaskDefinition.addContainer("otel-app", {
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/one-observability-workshop/demo-sampleapp:latest"),
      logging: ecs.LogDriver.awsLogs({ 
        streamPrefix: 'ecs',
        logGroup: appLogGroup
        }),
      });
      //test app at curl -v http://<IP>/outgoing-http-call
 
    // Add a port mapping
    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });



    const otelContainer = fargateTaskDefinition.addContainer("aws-otel-collector",{
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/aws-observability/aws-otel-collector:latest"),
      logging: ecs.LogDriver.awsLogs({ 
        streamPrefix: 'ecs',
        logGroup: adotLogGroup
        }),
      command: ["--config=/etc/ecs/ecs-amp-xray.yaml"],
      environment: {
          "REGION": "ap-southeast-1",
          "AWS_PROMETHEUS_ENDPOINT": "<REPLACE WITH YOUR AMP ENDPOINT>",
      },
    }
    )


    const promContainer = fargateTaskDefinition.addContainer("prometheus-exporter",{
      image: ecs.ContainerImage.fromRegistry("prom/prometheus:main"),
      logging: ecs.LogDriver.awsLogs({ 
        streamPrefix: 'ecs',
        logGroup: promLogGroup
        }),
      environment: {
          "REGION": "ap-southeast-1"
      },
    }
    ) 

  }
}
