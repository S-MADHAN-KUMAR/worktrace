import dns from 'node:dns'
import { Resolver } from 'node:dns/promises'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { neon } from '@neondatabase/serverless'
import type { NextRequest } from 'next/server'
import { getSession } from './session'

// Resilient DNS fallback for environments where local network router refuses *.neon.tech lookups
const fallbackResolver = new Resolver()
fallbackResolver.setServers(['8.8.8.8', '1.1.1.1'])

const origLookup = dns.lookup
// @ts-ignore
if (!globalThis.__worktrace_dns_patched) {
  // @ts-ignore
  globalThis.__worktrace_dns_patched = true
  // @ts-ignore
  dns.lookup = function (hostname: string, options: any, callback: any) {
    if (typeof options === 'function') {
      callback = options
      options = {}
    }
    origLookup(hostname, options, (err: any, address: any, family: any) => {
      if (err && (err.code === 'ENOTFOUND' || err.code === 'EREFUSED' || err.code === 'EAI_AGAIN')) {
        fallbackResolver.resolve4(hostname).then(addresses => {
          if (!addresses || addresses.length === 0) {
            callback(err)
          } else if (options && options.all) {
            callback(null, addresses.map(a => ({ address: a, family: 4 })))
          } else {
            callback(null, addresses[0], 4)
          }
        }).catch(() => callback(err))
      } else {
        callback(err, address, family)
      }
    })
  }
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password + '_worktrace_salt_v1').digest('hex')
}

export function getActiveDbUrl(reqOrUrl?: NextRequest | string): string {
  if (typeof reqOrUrl === 'string' && reqOrUrl.trim()) {
    return reqOrUrl.trim()
  }
  if (reqOrUrl && typeof reqOrUrl === 'object' && 'cookies' in reqOrUrl) {
    const session = getSession(reqOrUrl as NextRequest)
    if (session?.dbUrl?.trim()) {
      return session.dbUrl.trim()
    }
  }
  return process.env.DATABASE_URL || ''
}

export function persistDbUrlToEnv(dbUrl: string) {
  try {
    const envPath = path.resolve(process.cwd(), '.env')
    let content = ''
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, 'utf8')
    }
    if (/DATABASE_URL=/.test(content)) {
      content = content.replace(/DATABASE_URL=.*/, `DATABASE_URL=${dbUrl.trim()}`)
    } else {
      content = `${content.trim()}\nDATABASE_URL=${dbUrl.trim()}\n`
    }
    fs.writeFileSync(envPath, content, 'utf8')
    process.env.DATABASE_URL = dbUrl.trim()
  } catch (err) {
    console.warn('Could not persist DATABASE_URL to .env:', err)
  }
}

export function getSql(reqOrUrl?: NextRequest | string) {
  const url = getActiveDbUrl(reqOrUrl)
  if (!url) {
    throw new Error('Database URL is not configured. Please connect your Neon DB.')
  }
  return neon(url)
}

// Backward compatibility export
export const sql = neon(process.env.DATABASE_URL || 'postgresql://localhost:5432/neondb')

const initializedDbs = new Set<string>()

export async function initializeDatabase(reqOrUrl?: NextRequest | string) {
  const url = getActiveDbUrl(reqOrUrl)
  if (!url) {
    throw new Error('Database URL is not configured. Please connect your Neon DB.')
  }

  if (initializedDbs.has(url)) {
    return
  }

  const client = neon(url)

  try {
    await client`CREATE EXTENSION IF NOT EXISTS pgcrypto`
  } catch {
    // gen_random_uuid() is native on Postgres 13+, ignore extension error if unprivileged
  }

  await client`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      email TEXT,
      display_name TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  try {
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT`
    await client`ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT`
    await client`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`
  } catch {
    // Ignore migration warnings if columns already exist or permissions vary
  }

  await client`
    CREATE TABLE IF NOT EXISTS work_updates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      is_leave BOOLEAN NOT NULL DEFAULT FALSE,
      sick_leave BOOLEAN NOT NULL DEFAULT FALSE,
      casual_leave BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await client`
    CREATE TABLE IF NOT EXISTS work_update_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      work_update_id UUID NOT NULL REFERENCES work_updates(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  initializedDbs.add(url)
}
