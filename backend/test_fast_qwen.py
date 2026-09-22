import subprocess
import time
import requests
import json

modelfile = """FROM qwen3:4b
TEMPLATE \"\"\"{{- if .System }}<|im_start|>system
{{ .System }}<|im_end|>
{{ end }}
{{- range .Messages }}
{{- if eq .Role "user" }}<|im_start|>user
{{ .Content }}<|im_end|>
{{ else if eq .Role "assistant" }}<|im_start|>assistant
{{ .Content }}<|im_end|>
{{ end }}
{{- end }}<|im_start|>assistant
\"\"\"
PARAMETER stop "<|im_start|>"
PARAMETER stop "<|im_end|>"
PARAMETER temperature 0.6
"""

with open('Modelfile_test', 'w') as f:
    f.write(modelfile)

p = subprocess.run(['ollama', 'create', 'qwen3:4b-fast', '-f', 'Modelfile_test'], capture_output=True, text=True)
print("Create output:", p.stdout, p.stderr)

# Now test generation speed
t0 = time.time()
resp = requests.post("http://localhost:11434/api/chat", json={
    "model": "qwen3:4b-fast",
    "messages": [
        {"role": "system", "content": "You are CareerAI, a helpful career interviewer. Keep replies under 2 sentences."},
        {"role": "user", "content": "Hi, I am Alex Chen, a Full Stack Developer."}
    ],
    "stream": True
}, stream=True, timeout=20)

first = True
tokens = []
for line in resp.iter_lines():
    if line:
        d = json.loads(line)
        c = d.get("message", {}).get("content", "")
        if first and c:
            print(f"First token after: {time.time()-t0:.2f}s")
            first = False
        if c:
            tokens.append(c)

print(f"Total time: {time.time()-t0:.2f}s")
print("Response:", "".join(tokens))
