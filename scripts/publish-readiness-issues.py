#!/usr/bin/env python3
"""Publish the reviewed backlog once; retain a local issue URL manifest."""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = 'alvinxiao/tight'
MANIFEST = ROOT / 'docs/readiness-issues.json'


def api(endpoint, payload=None):
    command = ['gh', 'api', endpoint]
    if payload is not None:
        command += ['--method', 'PATCH' if endpoint == f'repos/{REPO}' else 'POST', '--input', '-']
    result = subprocess.run(command, input=json.dumps(payload) if payload is not None else None,
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def main():
    source = (ROOT / 'docs/production-readiness.md').read_text()
    entries = re.findall(r'^### ((R\d+|D\d+) · (P\d) · ([^\n]+))\n(.*?)(?=^### |^## |\Z)', source, re.M | re.S)
    if len(entries) != 26:
        raise ValueError(f'Expected 26 reviewed issues, got {len(entries)}')
    repo = api(f'repos/{REPO}')
    if not repo['has_issues']:
        api(f'repos/{REPO}', {'has_issues': True})
    existing = []
    page = 1
    while True:
        batch = api(f'repos/{REPO}/issues?state=all&per_page=100&page={page}')
        existing.extend(batch)
        if len(batch) < 100:
            break
        page += 1
    saved = {}
    for _, code, priority, title, content in entries:
        marker = f'<!-- tight-readiness:{code} -->'
        matches = [issue for issue in existing if marker in (issue.get('body') or '') and not issue.get('pull_request')]
        if len(matches) > 1:
            raise ValueError(f'Duplicate published marker {code}')
        body = (f'{marker}\n\nPriority: **{priority}**\n\n'
                'Release target: Windows desktop host; guests join from phones or browsers on the same Wi-Fi.\n\n'
                + content.strip() + '\n\n'
                'Reviewed against commit `d23ae0ca997174667780730f112d00b92b9ab917`.\n'
                'Backlog IDs such as R01 and D01 refer to the production-readiness plan.\n')
        issue = matches[0] if matches else api(f'repos/{REPO}/issues', {'title': f'[{code}][{priority}] {title}', 'body': body})
        saved[code] = {'number': issue['number'], 'url': issue['html_url'], 'title': issue['title']}
        MANIFEST.write_text(json.dumps(saved, indent=2) + '\n')
        print(f'{code} {issue["html_url"]}', flush=True)
    print(f'Confirmed {len(saved)} GitHub issues.', flush=True)


if __name__ == '__main__':
    main()
