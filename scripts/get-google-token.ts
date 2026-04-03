/**
 * One-time script to obtain the Google OAuth refresh token for the central calendar account.
 *
 * Run AFTER setting GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your shell:
 *
 *   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx tsx scripts/get-google-token.ts
 *
 * It will open a browser auth URL, start a local callback server on port 3333,
 * exchange the code for tokens, and print the refresh token to copy into .env.local
 */

import { google } from 'googleapis'
import * as http from 'http'
import * as url from 'url'

const REDIRECT_PORT = 3333
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/oauth/callback`
const SCOPES = ['https://www.googleapis.com/auth/calendar']

async function main() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(
      '\nError: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your environment.\n' +
        'Example:\n' +
        '  GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy npx tsx scripts/get-google-token.ts\n'
    )
    process.exit(1)
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent', // force refresh_token to be returned even if previously authorized
  })

  console.log('\n=== Google OAuth Token Setup ===')
  console.log('\nStep 1 — Open this URL in your browser:\n')
  console.log(authUrl)
  console.log(`\nStep 2 — Waiting for redirect on http://localhost:${REDIRECT_PORT} ...\n`)

  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsed = url.parse(req.url ?? '', true)
      const authCode = parsed.query.code as string | undefined

      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<h2>Authorization successful! You can close this tab and return to your terminal.</h2>')
        server.close()
        resolve(authCode)
      } else {
        const error = parsed.query.error ?? 'unknown error'
        res.writeHead(400, { 'Content-Type': 'text/html' })
        res.end(`<h2>Authorization failed: ${error}</h2>`)
        server.close()
        reject(new Error(`OAuth error: ${error}`))
      }
    })

    server.on('error', reject)
    server.listen(REDIRECT_PORT)
  })

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    console.error(
      '\nNo refresh_token returned. This usually means the account already authorized this app.\n' +
        'Fix: Go to https://myaccount.google.com/permissions, revoke access for your app, then re-run this script.\n'
    )
    process.exit(1)
  }

  console.log('\n=== SUCCESS ===')
  console.log('\nAdd the following line to your .env.local file:\n')
  console.log(`APP_CENTRAL_GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`)
  console.log('\n')
}

main().catch((err) => {
  console.error('\nFailed:', err.message)
  process.exit(1)
})
