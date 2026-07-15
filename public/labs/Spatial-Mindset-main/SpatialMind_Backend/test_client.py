import requests
import json

url = "http://localhost:8000/api/geometry/calculate"
payload = {
    "query": "Cho hình chóp S.ABCD đáy là hình vuông cạnh a, SA vuông góc với đáy."
}
headers = {
    "Content-Type": "application/json"
}
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
