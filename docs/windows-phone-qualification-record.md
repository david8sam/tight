# Windows and phone qualification record

Copy this template for one actual artifact and environment. This blank template records no test results. Use the [qualification procedure](windows-phone-qualification.md).

## Artifact and environment

| Field | Observed value |
| --- | --- |
| Test date and tester | UNRECORDED |
| GitHub Actions run URL | UNRECORDED |
| Full source revision | UNRECORDED |
| App version | UNRECORDED |
| Installer filename and SHA-256 | UNRECORDED |
| Installer signature status, publisher, certificate thumbprint | UNRECORDED |
| Installed app signature status, publisher, certificate thumbprint | UNRECORDED |
| Preview or signed candidate | UNRECORDED |
| Windows edition, build, architecture | UNRECORDED |
| Clean machine and standard account confirmation | UNRECORDED |
| Android model, OS, Chrome version | UNRECORDED |
| iPhone model, iOS, Safari version | UNRECORDED |
| Private network profile and router isolation settings | UNRECORDED |
| Additional adapters and VPN configuration | UNRECORDED |
| Previous version, source revision, and installer checksum for upgrade | UNRECORDED |
| Private evidence location | UNRECORDED |

## Observations

Use `passed`, `failed`, `blocked`, or `untested`. Each result needs observed behavior and an evidence reference. A later successful retry does not replace the original failure record.

| Scenario | Status | Observed behavior and evidence reference |
| --- | --- | --- |
| Clean standard-user install and Start menu launch | untested | |
| Spaces and Unicode in the account profile and per-user install path | untested | |
| Native SmartScreen and publisher prompts | untested | |
| Double launch focuses the existing host | untested | |
| Local-only default and selected private adapter | untested | |
| Firewall allow on Private network | untested | |
| Firewall deny and actionable recovery | untested | |
| Isolated guest Wi-Fi and recovery | untested | |
| Ethernet plus Wi-Fi selection | untested | |
| VPN adapter selection | untested | |
| Address change, stale links, and sharing restart | untested | |
| Android Chrome invitation and assigned-player edits | untested | |
| iOS Safari invitation and assigned-player edits | untested | |
| Two physical phones and connected-device list | untested | |
| Spectator and unassigned-player write restrictions | untested | |
| Setup, strategy picks, turns, planets, scoring, rounds, results | untested | |
| Three-hour session with actual duration and player count | untested | |
| Phone background, screen lock, and Wi-Fi loss recovery | untested | |
| Host sleep and resume | untested | |
| Host reboot preserves acknowledged changes and permissions | untested | |
| Abrupt process-tree termination preserves acknowledged changes | untested | |
| Offline launch, resume, pairing, and confirmed edit | untested | |
| Setup and uninstall refuse during live hosting | untested | |
| Signed cross-version upgrade preserves games and permissions | untested | |
| Failed download preserves the working installation | untested | |
| Failed migration preserves recoverable original data | untested | |
| Uninstall and reinstall preserve saves and paired permissions | untested | |

## Failures and release decision

- First-failure reproduction and issue links: UNRECORDED
- Diagnostics and redacted evidence references: UNRECORDED
- Remaining blocked or untested scenarios: ALL
- Signing and distribution-rights review references: UNRECORDED
- Manual accessibility qualification reference: UNRECORDED
- Release reviewer and review date: UNRECORDED
- Decision: NOT QUALIFIED. Complete the actual tests and review before changing this value.
