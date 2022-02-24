import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";


export class vpc extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "VPC", {
      vpcName: "myvpc",
      cidr: "192.168.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });
    // s3 bucket
    const bucket = new s3.Bucket(this, "MyFirstBucket", {
      bucketName: "nv-good-product",
    });

    // iam role for ec2
    const role = new iam.Role(this, "Role", {
      roleName: `ec2-s3-access-role`,
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      description: "This is a custom role...",
    });

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["s3:CreateBucket", "s3:GetObject", "s3:ListBucket",  "s3:HeadBucket","s3:Headobject", "s3:ListAllMyBuckets"],
        resources: [
            "arn:aws:s3:::nu-good-product/*",
            "arn:aws:s3:::nu-good-product"  
        ],
      })
    );
    role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["s3:ListBucket", "s3:HeadBucket", "s3:HeadObject","s3:ListAllMyBuckets"],
          resources: ["*"],
        })
      );

    // security group
    const securityGroup = new ec2.SecurityGroup(this, "simple-instance-1-sg", {
      vpc: vpc,
      allowAllOutbound: true, // will let your instance send outboud traffic
      securityGroupName: "sample-sg",
    });
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "Allows SSH access from Internet"
    );
    new ec2.Instance(this, 'instance',{
        vpc: vpc,
        instanceName: 'good-product',
        instanceType: new ec2.InstanceType('t2.micro'),
        role: role,
        securityGroup: securityGroup,
        keyName: 'my-key',
        machineImage: ec2.MachineImage.latestAmazonLinux({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
        }),
  
      })
  }
}
