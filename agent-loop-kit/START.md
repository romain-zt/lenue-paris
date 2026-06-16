# Agent Loop Kit v0.1 — START

Three commands:

```bash
unzip agent-loop-kit-v0.1.zip && cd agent-loop-kit
chmod +x bootstrap.sh verify.sh
./bootstrap.sh "your rough draft idea here"
```

Requirements: **Node 20 LTS**, **`OPENAI_API_KEY`** for live loop (offline demo works without).

Verify before first run:

```bash
./verify.sh --offline   # zero network, must go green
./verify.sh --live      # optional, needs API key
```

Session-one flow: draft idea → Idea Seed → Vision PRD → Convergence Packet → human veto → one slice → overlay writes. Core is never edited.
