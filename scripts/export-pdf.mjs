// Экспорт PDF-презентации: слайды 1920×1080 с маршрута /print.
// Использование:
//   npm run build -- --base=/djnagoo/ && npx vite preview --base=/djnagoo/ --port 4173
//   node scripts/export-pdf.mjs [url] [out.pdf]
// Нужен Chrome/Chromium: CHROME_PATH или `npx playwright-core install chromium`.
import { chromium } from 'playwright-core'
import { existsSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/djnagoo/?print=1'
const out = process.argv[3] ?? 'DJ-NAGOO-press-kit.pdf'
const executablePath =
  process.env.CHROME_PATH ??
  ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))

const browser = await chromium.launch(executablePath ? { executablePath } : {})
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__printReady === true, null, { timeout: 30000 })
await page.pdf({ path: out, width: '1920px', height: '1080px', printBackground: true, preferCSSPageSize: true })
await browser.close()
console.log('PDF:', out)
