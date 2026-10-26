import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/desktop',
    outputDir: 'test-results/desktop',
    timeout: 60000,
    workers: 1,
    forbidOnly: Boolean(process.env.CI),
    reporter: 'list',
    use: { trace: 'retain-on-failure' },
});
