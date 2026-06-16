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
                    idx = data.get('step_index')
                    if 354 <= idx < 395:
                        print(f"Step {idx} ({data.get('source')}, {data.get('type')}): {data.get('content') or ''}")
                except Exception as e:
                    pass
    except Exception as e:
        print(f"Error opening log: {e}")

if __name__ == '__main__':
    main()
