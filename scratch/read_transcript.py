import sys
import json

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    log_path = r'C:\Users\dhana\.gemini\antigravity-ide\brain\780d5583-98f2-411d-9dee-0a6750a3d52f\.system_generated\logs\transcript.jsonl'
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    data = json.loads(line)
                    if data.get('type') == 'USER_INPUT' or data.get('source') == 'USER_EXPLICIT':
                        print(f"Step {data.get('step_index')}: {data.get('content')}")
                except Exception as e:
                    pass
    except Exception as e:
        print(f"Error opening log: {e}")

if __name__ == '__main__':
    main()
