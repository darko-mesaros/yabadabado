import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as amplify from '@aws-cdk/aws-amplify-alpha';
import { Construct } from 'constructs';
const path = require('path');

export class YabadabadoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB table
    const table = new dynamodb.Table(this, 'softwarecatalog', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      tableName: 'softwarecatalog'
    });
    
    // lambda to fetch all
    const getLambda = new lambda.Function(this, 'getLambda',{
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'handler.lambda_handler',
      environment: {
        'TABLE_NAME': table.tableName
      },
      code: lambda.Code.fromAsset(path.join(__dirname,'../resources/lambda/getlambda'),{
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
          ],
        }
      }),
    })
    table.grantReadData(getLambda);

    const genLambda = new lambda.Function(this, 'genLambda',{
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'handler.lambda_handler',
      timeout: cdk.Duration.seconds(60),
      environment: {
        'TABLE_NAME': table.tableName
      },
      code: lambda.Code.fromAsset(path.join(__dirname,'../resources/lambda/genlambda'),{
        bundling: {
          image: lambda.Runtime.PYTHON_3_9.bundlingImage,
          command: [
            'bash',
            '-c',
            'pip install -r requirements.txt -t /asset-output && cp -au . /asset-output',
          ],
        }
      }),
    })
    table.grantReadData(genLambda);

    const bedrockPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: ['*']
    })

    genLambda.role?.attachInlinePolicy(
      new iam.Policy(this, 'invoke-model-bedrock',{
        statements: [bedrockPolicy]
      })

    );

    // API Gateway
    const api = new apigateway.RestApi(this, "softwarectlgAPI",{
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS, // this is also the default
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
      }
    });

    const swctlg = api.root.addResource('software')
    swctlg.addMethod("GET", new apigateway.LambdaIntegration(getLambda));

    const genapi = swctlg.addResource('generate')
    genapi.addMethod("POST", new apigateway.LambdaIntegration(genLambda));


    // Amplify Hosting
    //const amplifyApp = new amplify.App(this, 'Hosting', {
    //  appName: 'bedrock-keynote',
    //  sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
    //    owner: 'darko-mesaros',
    //    repository: 'starwars-quote-api',
    //    oauthToken: cdk.SecretValue.secretsManager('github-token')
    //  }),
    //  
    //  buildSpec: cdk.aws_codebuild.BuildSpec.fromObjectToYaml({
    //    "version": 0.1,
    //    "frontend": {
    //      "phases": {
    //        "preBuild": {
    //          "commands": [
    //            "cd swquotes_fe",
    //            "npm ci"
    //          ]
    //        },
    //        "build": {
    //          "commands": [
    //            "npm run build"
    //          ]
    //        }
    //      },
    //      "artifacts": {
    //        "baseDirectory": "swquotes_fe/build",
    //        "files": [
    //          "**/*" 
    //        ]
    //      },
    //      "cache": {
    //        "paths": [
    //          "swquotes_fe/node_modules/**/*"
    //        ]
    //      }
    //    }
    //  })
    //  
    //})

    //amplifyApp.addBranch('mainbranch', {
    //  stage: 'PRODUCTION',
    //  branchName: 'main'
    //})

  }
}
