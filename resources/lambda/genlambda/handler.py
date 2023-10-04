import json
import boto3

def decode_json(data_string):
    try:
        data = json.loads(data_string)
        print("This worked:")
        print(data_string)
        return data
    except json.JSONDecodeError as e:
        print("I was unable to decode JSON: ", e)
        print(data_string)
        err_json = {
            'name':'Well this is embarrassing',
            'description':'This is your Lambda function. The JSON I got was mangled, and I was unable to decode it. Please check the logs to see what I got, and deduce why I was unable to work with it.'
            #'description':json.JSONDecodeError
                }
        return err_json

def lambda_handler(event, context):
    body = json.loads(event['body'])
    description = body.get('description')

    bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
    prompt = """Take the text from the description, a description of AWS Cloud Service, and change it so it sounds like a software description written in the late 1980s. Make it sound like its for some enterprise software. Give it a catchy name, and also provide a pricing plan. Give us a brief description on how this software is deployed. 

Return the data in raw JSON format where the name will be under "name" and description under "description". Make sure your response is just JSON and nothing else. Print the JSON on a single line, and do not include new lines in the text. Make it as single element JSON object. Only the "name" and "description" should be part of this JSON. Do not respond with anything else besides the JSON object.
    Description: {description}
    """.format(description=description).encode('unicode-escape').decode('utf-8')

    body = json.dumps({
            "prompt": "Human: "+prompt+"\nAssistant:",
            "max_tokens_to_sample": 1000,
            "temperature": 1,
            "top_k": 250,
            "top_p": 0.999,
            "stop_sequences": ["\n\nHuman:"],
            "anthropic_version": "bedrock-2023-05-31"
        })

    modelId = 'anthropic.claude-v2'
    accept = '*/*'
    contentType = 'application/json'

    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)

    response_body = json.loads(response.get("body").read())
    completion = response_body.get('completion')
    data = decode_json(completion)
    print("DEBUG")
    print(data)

    return {
        'statusCode': 200,
        'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            },
        'body': json.dumps({
            'message': 'Data Processed Succesfully',
            'received_description': description,
            'name': data['name'],
            'description': data['description']
            })
    }
