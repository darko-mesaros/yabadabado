import json
import boto3

def decode_json(data_string):
    try:
        data = json.loads(data_string)
        return data
    except json.JSONDecodeError as e:
        print("I was unable to decode JSON: ", e)
        print(data_string)
        err_json = {
                'name': 'Well this is embarrassing',
                'description':'This is your lambda function. The JSON I got was mangled, and I was unable to decode it. Please go check the logs to see what is up'
                }
        return err_json

def lambda_handler(event, context):

    body = json.loads(event['body'])

    description = body.get('description')
    bedrock = boto3.client("bedrock-runtime", region_name="us-west-2")
    prompt = """
Take the text from the description, a description of AWS Cloud Service, and change it so it sounds like a software description written in the late 1980s. Make it sound like its for some enterprise software. Give it a catchy name, and also provide a pricing plan. Give us a brief description on how this software is implemented. 

Return the data in raw JSON format where the name will be under "name" and description under "description". Make sure your response is just JSON and nothing else. Print the JSON on a single line, and do not include new lines in the text. Make it as single element JSON object. Only the "name" and "description" should be part of this JSON. Do not respond with anything else besides the JSON object.

Description: {description}""".format(description=description).encode('unicode-escape').decode('utf-8')

    modelId ='anthropic.claude-v2'
    contentType = 'application/json'
    accept = '*/*'

    body = json.dumps({
        "prompt": "Human: "+prompt+"\Assistant:",
        "max_tokens_to_sample": 901,
        "temperature": 1,
        "top_k": 250,
        "top_p": 0.999,
        "stop_sequences": ["\n\nHuman:"],
        "anthropic_version": "bedrock-2023-05-31"
        })

    response = bedrock.invoke_model(body=body, modelId=modelId, accept=accept, contentType=contentType)
    response_body = json.loads(response.get("body").read())
    completion = response_body.get('completion')

    data = decode_json(completion)

    return {
        'statusCode': 200,
        'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            },
        'body': json.dumps({
            'message': 'I am a Lambda function',
            'received_description': description,
            'name': data['name'],
            'description': data['description']
            })
    }
