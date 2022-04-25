# Welcome to setup for OpenTelemetry with ECS Fargate with CDK

This project uses CDKv2 to setup  \AWS Distro for OpenTelemetry for Amazon Elastic Container Service (Amazon ECS). This enables OpenTelemetry metrics and traces collection on Amazon ECS. The application will run in an Amazon ECS cluster with AWS Fargate, and the metrics will be stored in Amazon Managed Service for Prometheus workspace and traces in AWS X-Ray.

## CDKv2 Setup

Setup CDKv2 as shown here
https://docs.aws.amazon.com/cdk/v2/guide/getting_started.html

## Setup the project

`mkir dir otel-ecs-fargate-stack`

`cdk init app --language typescript`

Replace the script content in lib with the one in lib/otel-ecs-fargate-cdk.ts

`cdk deploy`
