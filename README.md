# Refinzi 2.0

> Local-first Windows prompt tool that turns 1-line ideas into calibrated cinematic AI video/image prompts in under 2 seconds.

Refinzi is built for AI video creators, prompt engineers, and digital artists using tools like Higgsfield, Runway, Midjourney, Sora-style workflows, Pika, Luma, and other generative media tools.

Instead of manually rewriting the same camera, lighting, atmosphere, and motion language every time, Refinzi sits quietly on Windows and helps expand rough ideas into structured prompts you can paste into your creative AI stack.

[Website](https://refinzi.com) · [Releases](https://github.com/papada1472/refinzi/releases) · [Issues](https://github.com/papada1472/refinzi/issues) · [Discussions](https://github.com/papada1472/refinzi/discussions)

---

## What it does

Turn this:

```txt
a lonely astronaut walking through a red desert
```

Into something closer to this:

```txt
A lonely astronaut walks slowly across a vast red desert at golden hour, captured in a slow low-angle tracking shot with subtle handheld inertia. Fine dust lifts around each step, heat haze bends the distant horizon, and warm volumetric backlight catches the edges of the suit. Shallow depth of field, grounded walking motion, soft lens bloom, cinematic sci-fi realism, restrained color grade, no exaggerated camera shake, no warped anatomy.
```

Refinzi is designed to add the technical cinematic scaffolding creators often repeat manually:

- camera choreography
- lens and framing language
- volumetric lighting
- subject and environment motion
- atmosphere and texture
- temporal consistency cues
- model-friendly constraints

---

## Why creators use it

| Workflow problem | Refinzi approach |
|---|---|
| Writing camera/lighting jargon repeatedly | Expand a 1-line idea into a structured cinematic prompt |
| Losing flow by switching tabs/tools | Use the Windows Orb or hotkey in-place |
| Generic prompt-generator output | Focus on camera, lighting, motion physics, and usable creative direction |
| Privacy concerns | Local-first app with no cloud prompt logging by Refinzi |
| Expensive AI wrappers | Bring your own API key with 0% markup from Refinzi |
| Trust concerns around Windows installers | Open-source repo, build-from-source path, release checksum |

---

## Core features

- **Ambient Windows Orb** — refine highlighted text from anywhere in Windows.
- **Hotkey workflow** — press `Ctrl + Alt + Space` for fast prompt transformation.
- **Cinematic prompt expansion** — camera movement, lighting, motion physics, atmosphere, constraints.
- **BYOK provider setup** — connect supported model providers with your own keys.
- **Local-first privacy model** — app runs on your machine; Refinzi does not operate a prompt logging backend.
- **Open-source** — inspect the code or build from source before installing.

---

## Trust and privacy notes

Refinzi is a Windows desktop app, so trust matters. Before installing, you can inspect the source, review the release checksum, or build locally.

- API keys are intended to be stored locally using Windows-protected storage/encryption.
- Refinzi does not add a cloud logging layer for your prompts.
- Requests may still be sent to the AI provider you configure through BYOK, subject to that provider's own privacy/data policies.
- The Windows installer is currently unsigned, so SmartScreen may show a warning on first install.

Read more: [Trust & Privacy](docs/TRUST_AND_PRIVACY.md)

---

## Install on Windows

Latest release: [Refinzi v2.0.0](https://github.com/papada1472/refinzi/releases/tag/v2.0.0)

Installer asset:

```txt
Refinzi-Setup-v2.0.0.exe
```

SHA256 checksum:

```txt
bd2416a3277b56ad1b2a119d8e9536aae0618f45d659c8269dd944f525a1c1e2
```

To verify on Windows PowerShell after download:

```powershell
Get-FileHash .\Refinzi-Setup-v2.0.0.exe -Algorithm SHA256
```

The output should match the checksum above.

> Note: Because this is an unsigned indie Windows app, Windows SmartScreen may show a warning. If you are not comfortable installing a binary, build from source instead.

---

## Build from source

Prerequisites:

- Windows 10 or 11
- Node.js 18+
- npm

```bash
git clone https://github.com/papada1472/refinzi.git
cd refinzi
npm install
npm run dev
```

Build the Windows installer locally:

```bash
npm run dist
```

The generated installer should appear in the local `dist/` directory.

---

## First prompt tests

Try these rough ideas to evaluate whether Refinzi helps your workflow:

```txt
a samurai walking through fog at sunrise
```

```txt
a luxury perfume bottle floating in black water
```

```txt
a woman running through a neon alley in the rain
```

```txt
a retro robot exploring an abandoned mall
```

```txt
a cinematic product shot of wireless headphones on sand
```

Good feedback is not just "it works." The most useful feedback is:

- Which generated lines felt generic?
- Was the prompt too long or too short?
- Did camera motion help the final output?
- Should output be model-specific for Runway, Higgsfield, Midjourney, etc.?
- What would make you open the app again tomorrow?

---

## Roadmap for creator feedback

Near-term improvements being shaped by early users:

- model-specific output modes for AI video/image tools
- better cinematic preset packs
- shorter and longer prompt variants
- clearer first-run onboarding
- easier bad-output reporting
- more examples for real AI video workflows

Open a GitHub issue or discussion if you want a specific workflow supported.

---

## Development

Run tests:

```bash
npm test
```

Run local landing/docs site if needed:

```bash
cd landing
npm install
npm run dev
```

---

## Community and support

- [Report bugs or request features](https://github.com/papada1472/refinzi/issues)
- [Join GitHub Discussions](https://github.com/papada1472/refinzi/discussions)
- [Official website](https://refinzi.com)
- Email: contact@refinzi.com

---

## License

MIT License. See [LICENSE](LICENSE).
