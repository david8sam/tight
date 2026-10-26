# Qualify a Windows build with real phones

Use this procedure to collect the physical release evidence required by [issue #26](https://github.com/alvinxiao/tight/issues/26). Run the installed artifact on a clean Windows 11 x64 machine under a standard user account. Use actual Android and iOS phones. Browser viewport emulation and CI results cannot fill these records.

The current artifact is an unsigned evaluation preview. You can record preview findings, but signed release qualification stays blocked until the publisher and distribution-rights work in [issue #23](https://github.com/alvinxiao/tight/issues/23) is complete. A passing preview run does not qualify a later signed installer. Repeat the applicable checks on the artifact intended for release.

## Prepare a disposable test environment

1. Download the intended installer from its successful GitHub Actions run. Retain the run URL and the complete source revision.
2. Copy the [qualification record](windows-phone-qualification-record.md) outside the repository. Create one record for each artifact and environment combination.
3. Record Windows edition, build, architecture, account type, phone models, OS versions, and browser versions. Confirm the PC has no Node or Git prerequisite.
4. Use disposable game data and test player names. Export any existing games before testing installation, abrupt termination, or recovery. Use a clean Windows account or VM for installer tests.
5. Prepare a trusted Private Wi-Fi network with at least two real phones. Record whether client isolation, a VPN, Ethernet, or another adapter is present.

Use Windows PowerShell to identify the exact installer. Replace the path with the downloaded file. Preserve the outputs with the record.

```powershell
$installerPath = 'C:\Users\Tester\Downloads\TIGHT-preview-setup.exe'
Get-FileHash -LiteralPath $installerPath -Algorithm SHA256
Get-AuthenticodeSignature -LiteralPath $installerPath |
    Select-Object Status, StatusMessage, @{Name='Publisher'; Expression={$_.SignerCertificate.Subject}}, @{Name='Thumbprint'; Expression={$_.SignerCertificate.Thumbprint}}
```

For a signed candidate, compare the publisher with the intended release identity. Record the installed `TIGHT.exe` signature as well. A checksum identifies bytes; it does not establish authenticity. Record SmartScreen and publisher prompts as observed. Do not disable Windows security to obtain a pass.

## Install and establish a baseline

1. Install as the standard user. Record every prompt and whether elevation was requested. Verify the Start menu shortcut opens TIGHT without a console or developer tools.
2. The installer fixes its per-user destination and does not offer a custom folder. To check spaces and non-ASCII paths, repeat in a clean test account whose actual profile path contains those characters. Record the resulting install path privately.
3. Open TIGHT twice. Verify the second launch focuses the existing window and does not create a second host.
4. Create a game with at least two player slots. Record its settings and the saved-game name privately.
5. Export the game. Retain the export as the baseline for later recovery checks.
6. Quit through the close prompt. Reopen from the Start menu and resume the game. Compare factions, players, settings, and saved values with the baseline.

## Exercise Wi-Fi and permission boundaries

1. Start with sharing off. Verify the app reports local-only hosting.
2. Start **Wi-Fi sharing** on the intended private adapter. If Windows prompts, allow Private-network access. Record the network profile and firewall result.
3. Create separate player invitations for Android Chrome and iOS Safari. Scan each private QR code on its intended phone. Assign each player to a faction.
4. Verify the host's **Connected devices** list names both players. Refresh it after a phone disconnects. Verify a spectator cannot change game data.
5. Make a legal public change from each assigned player. Compare the result on the host and the other phone. Verify ordinary players cannot edit an unassigned faction or administer the game.
6. On a fresh disposable Windows environment, deny inbound firewall access. Verify the app stays usable locally and its guidance explains Private-network access without disabling the firewall.
7. Test phones on an isolated guest network. Record the failed connection and recovery after returning to the trusted Wi-Fi. Do not forward a router port.
8. Repeat adapter selection with Ethernet plus Wi-Fi and with a VPN enabled. Record the selected adapter. Stop sharing, change the PC's address, and check that stale invitations do not silently connect to a different host.
9. Stop sharing. Verify phones disconnect while the desktop game remains usable. Start sharing again and use fresh invitation or reconnect links as appropriate.

An unavailable firewall prompt, second adapter, VPN, or isolated network is a blocked or untested scenario. It is not a pass inferred from another setup.

## Complete a representative game and recovery session

1. Complete faction assignment and start the game. Pick strategy cards, take turns, acquire and edit planets, score public and private objectives, change phases, advance a round, and finish the game. Compare synchronized state on all devices after each stage.
2. Run an extended session for at least three hours with representative player counts and repeated edits. Record the actual start and end times, player count, and any connection or save failures.
3. Background each phone, lock its screen, then return to the browser. Repeat after Wi-Fi is turned off and restored. Verify reconnection shows the committed state before accepting further edits.
4. Put the host to sleep with both phones connected. Resume it and inspect sharing status. If its address changed, choose the current adapter. Verify phones reconnect through the current host address.
5. Confirm a change shows **Saved**. Quit and reboot Windows. Resume the game and compare that change, the library name and archive status, and device permissions. Use the new host address if the port changed.
6. With disposable data, confirm another change shows **Saved**, then end the TIGHT process tree abruptly. Reopen and verify the acknowledged change remains. Record any startup failure before attempting recovery.
7. Disconnect internet access while keeping the LAN connected. Launch, resume, pair a new phone, and make a confirmed change. Verify no online dependency prevents local play.

For a lost or uncertain acknowledgment, record the pending state and use **Check last change** before repeating an action. A later successful launch does not erase an earlier failure. Retain the first failure's diagnostics and reproduction steps.

## Check updates and removal

1. Back up the data folder and export important games before an upgrade. Retain both installer checksums and both source revisions.
2. While a disposable game is actively hosted, run setup and uninstall separately. Verify each refuses without stopping the host or disconnecting its phones.
3. Quit TIGHT and install the intended newer version. Resume the saved game and verify saved values, names, archive status, and paired-device permissions.
4. Uninstall through Windows Settings. Reinstall under the same account. Verify saves and paired permissions remain available.
5. Test failed-download and failed-migration recovery separately using disposable data. Record the exact failure and whether the original app and database remain recoverable. If a failure cannot be reproduced safely, mark that scenario blocked and request a controlled test from the release maintainer. Do not infer cross-version behavior from same-build reinstall.

Follow the [manual update procedure](windows-installer.md#manual-beta-update). Automatic app rollback is not implemented. Never open the only copy of a newer database with an older app to test a downgrade.

## Record and review the result

1. Set each scenario to `passed`, `failed`, `blocked`, or `untested`. Record the observed behavior and an evidence reference for every pass or failure.
2. Export **Help > Export diagnostics...** after a failure. Review the JSON before sharing it. Retain screenshots or recordings of native prompts and connection failures.
3. Keep game exports, invitation QR codes, cookie values, player names, local addresses, installation paths, and private objectives out of public reports. Store raw evidence privately and publish redacted references.
4. Link failures to issues with the exact artifact, environment, steps, expected result, and observed result. Keep unresolved failures visible when a later run passes.
5. Have a release reviewer check the record, artifact identity, signing result, and remaining blocks. Keep #26 open until its actual Windows-and-phone acceptance criteria are satisfied.

Use the separate [accessibility checklist](accessibility.md) for manual keyboard, assistive-technology, contrast, zoom, and touch qualification. This procedure does not replace security or distribution-rights review.
