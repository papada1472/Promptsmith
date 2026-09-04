# Trust & Privacy

Refinzi is a local-first Windows desktop app for AI video/image prompt workflows. This document explains what to check before installing and how the privacy model is intended to work.

## Short version

- Refinzi runs as a Windows desktop app.
- Refinzi is open-source, so you can inspect the code before installing.
- Refinzi uses a bring-your-own-key model. You configure your own AI provider key.
- Refinzi does not operate a cloud prompt logging backend.
- Prompts may still be sent to whichever AI provider you configure, subject to that provider's own policies.
- The current Windows installer is unsigned, so Windows SmartScreen may warn on first install.

## What stays local

Refinzi is designed so the app, UI workflow, prompt transformation interface, settings, and local key storage live on your Windows machine.

API keys are intended to be protected locally using Windows-protected storage/encryption mechanisms. Do not share screenshots or logs containing your keys.

## What may leave your machine

If you configure an external AI provider through BYOK, the text you ask Refinzi to transform may be sent to that provider so the model can generate the refined prompt.

Examples of provider categories include OpenAI, Anthropic, Gemini, DeepSeek, OpenRouter, or similar supported providers. Each provider has its own privacy, logging, and retention policy. Review your chosen provider's terms before sending sensitive text.

## What Refinzi does not claim

Refinzi cannot control what your selected AI provider logs or retains. "Local-first" means Refinzi is not adding its own cloud logging layer; it does not mean every configured provider is local or private.

## Windows installer trust

The GitHub Release includes a Windows installer asset:

```txt
Refinzi-Setup-v2.0.0.exe
```

SHA256:

```txt
bd2416a3277b56ad1b2a119d8e9536aae0618f45d659c8269dd944f525a1c1e2
```

Verify after download with PowerShell:

```powershell
Get-FileHash .\Refinzi-Setup-v2.0.0.exe -Algorithm SHA256
```

The hash should match the SHA256 above.

## SmartScreen warning

Refinzi is currently an unsigned indie Windows app. Windows SmartScreen may display a warning even if the file is unchanged. If you are not comfortable installing an unsigned binary, build from source.

## Build from source

```bash
git clone https://github.com/papada1472/refinzi.git
cd refinzi
npm install
npm run dev
```

To build a local installer:

```bash
npm run dist
```

## Recommended safety checklist

Before installing:

1. Inspect the repository and recent commits.
2. Read the README and this trust document.
3. Verify the release checksum.
4. Use a low-risk test prompt first.
5. Do not paste secrets, private client data, or unreleased confidential work into any AI provider unless you trust that provider's data policy.

## Reporting concerns

If you find a security issue, please use the repository's security instructions or open a responsible report through GitHub.
