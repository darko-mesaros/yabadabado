import boto3
import uuid
import json

# open the file
with open('software.json', 'r') as file:
    data = json.load(file)

if not isinstance(data, list):
    raise ValueError("The JSON Data should be a list of dictionaries")

session = boto3.session.Session(region_name="us-west-2")
dynamodb = session.resource('dynamodb')
table = dynamodb.Table('softwarecatalog')

for item in data:
    if not isinstance(item, dict):
        raise ValueError(
                f"Expected dictionary, but found {type(item)}. Data: {item}")

    item["id"] = str(uuid.uuid4())

    if table.put_item(Item=item):
        print(f"Created new entry for {item['name']}")
