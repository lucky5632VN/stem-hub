from google.genai import types
import json

schema = types.Schema(
    type="OBJECT",
    properties={
        "test": types.Schema(type="STRING")
    }
)
print("Schema with type='OBJECT':", schema)

try:
    schema2 = types.Schema(type_="OBJECT")
    print("Schema with type_='OBJECT':", schema2)
except Exception as e:
    print("Error with type_:", e)
