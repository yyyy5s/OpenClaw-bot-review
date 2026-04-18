import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { withBasePath } from '@/lib/base-path'

export async function GET() {
  const dir = path.join(process.cwd(), 'public', 'assets', 'pixel-office')
  try {
    const files = fs.readdirSync(dir)
    const tracks = files
      .filter(f => f.toLowerCase().endsWith('.mp3'))
      .map(f => withBasePath(`/assets/pixel-office/${f}`))
    return NextResponse.json({ tracks })
  } catch {
    return NextResponse.json({ tracks: [] })
  }
}
