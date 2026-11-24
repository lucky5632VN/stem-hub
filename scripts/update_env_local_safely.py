import json
import os

def update_env_local():
    json_file = 'cuoc-thi-ai-e2044-firebase-adminsdk-fbsvc-4fc6b7202b.json'
    if not os.path.exists(json_file):
        print(f"Error: {json_file} does not exist.")
        return False

    with open(json_file, 'r', encoding='utf-8') as f:
        key_data = json.load(f)

    proj_id = key_data['project_id']
    client_email = key_data['client_email']
    private_key = key_data['private_key']

    formatted_pk = private_key.replace('\r', '').replace('\n', '\\n')

    env_path = '.env.local'
    if not os.path.exists(env_path):
        lines = []
    else:
        with open(env_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

    new_lines = []
    seen_proj_id = False
    seen_client_email = False
    seen_pk = False

    for line in lines:
        stripped = line.strip()
        if stripped.startswith('FIREBASE_PROJECT_ID='):
            if not seen_proj_id:
                new_lines.append(f'FIREBASE_PROJECT_ID="{proj_id}"\n')
                seen_proj_id = True
            else:
                continue
        elif stripped.startswith('FIREBASE_CLIENT_EMAIL='):
            if not seen_client_email:
                new_lines.append(f'FIREBASE_CLIENT_EMAIL="{client_email}"\n')
                seen_client_email = True
        elif stripped.startswith('FIREBASE_PRIVATE_KEY='):
            if not seen_pk:
                new_lines.append(f'FIREBASE_PRIVATE_KEY="{formatted_pk}"\n')
                seen_pk = True
        else:
            new_lines.append(line)

    if not seen_proj_id:
        new_lines.insert(0, f'FIREBASE_PROJECT_ID="{proj_id}"\n')
    if not seen_client_email:
        new_lines.insert(1, f'FIREBASE_CLIENT_EMAIL="{client_email}"\n')
    if not seen_pk:
        new_lines.insert(2, f'FIREBASE_PRIVATE_KEY="{formatted_pk}"\n')

    with open(env_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print("SUCCESS: .env.local has been safely updated with cuoc-thi-ai-e2044 credentials.")
    return True

if __name__ == '__main__':
    update_env_local()

