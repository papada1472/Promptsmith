# Security Policy

## 🛡️ Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

## 🔒 Security Architecture

Refinzi is built strictly with **local-first client-side security**:
- **API Keys**: Encrypted on-device using Windows DPAPI (AES-256). They are never transmitted to Refinzi servers.
- **Prompt Isolation**: Highlighted text is processed in-memory and instantly replaced or copied. Zero prompt logging.
- **Zero Cloud Telemetry**: Refinzi does not monitor keystrokes or record screen context.

## 🚨 Reporting a Vulnerability

If you discover a security issue or vulnerability in Refinzi:
1. Please **do NOT** open a public GitHub issue.
2. Email the maintainer directly at **security@refinzi.com** or **contact@refinzi.com**.
3. We will review and remediate critical security vulnerabilities within 24–48 hours.
