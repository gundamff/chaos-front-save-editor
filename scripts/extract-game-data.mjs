#!/usr/bin/env node
/**
 * Chaos Front 游戏素材提取
 * 用法:
 *   node scripts/extract-game-data.mjs --game "F:\...\Chaos Front_Data" \
 *     --ripper "C:\path\AssetRipper.GUI.Free.exe" --out .
 * 可选:
 *   --export <dir>  复用已有的 AssetRipper 导出目录（跳过导出，仍需 --ripper 或可省略）
 * Phase1 数据: 直接从 resources.assets 抠 TextAsset XML（无需 AssetRipper）
 * Phase2 图像: AssetRipper headless 导出后按 Sprite 矩形裁切
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { PNG } from 'pngjs'

const args = parseArgs(process.argv.slice(2))
const GAME = args.game
const RIPPER = args.ripper
const OUT = args.out ?? '.'
const PORT = 18923
const EXPORT = args.export
  ? path.resolve(args.export)
  : path.join(process.env.TEMP ?? '/tmp', 'cfse_rip_export')

if (!GAME) die('缺少 --game <Chaos Front_Data 目录>')

// ---------- Phase 1: TextAsset XML ----------
const resAssets = path.join(GAME, 'resources.assets')
const bin = fs.readFileSync(resAssets)
const tables = {
  unitType: extractXml('<UnitTypeData>'),
  unitLevel: extractXml('<UnitLevelData>'),
  character: extractXml('<CharacterData>'),
  item: extractXml('<ItemData>'),
  language: extractXml('<LanguageData>'),
  army: extractXml('<ArmyData>')
}

const lang = parseXmlItems(tables.language).map((attrs) => xmlUnescape(attrs.CN ?? ''))

const unitTypes = parseXmlItems(tables.unitType).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `机型${a.Index}`,
  kind: num(a.Kind), size: num(a.Size), levelType: num(a.LevelType), model: num(a.Model)
}))

const levelTables = {}
for (const a of parseXmlItems(tables.unitLevel)) {
  levelTables[String(num(a.Index))] = Array.from({ length: 7 }, (_, i) => num(a[`EXP${i}`]))
}

const characters = parseXmlItems(tables.character).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `驾驶员${a.Index}`, portrait: num(a.Portrait)
}))

const items = parseXmlItems(tables.item).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `装备${a.Index}`, icon: num(a.Icon)
}))

const armies = parseXmlItems(tables.army).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `军团${a.Index}`, flag: num(a.Flag)
}))

const unitMaxExp = {}
for (const u of unitTypes) {
  const t = levelTables[String(u.levelType)]
  unitMaxExp[String(u.id)] = t ? t[6] : 11970
}

function extractXml(tag) {
  const close = `</${tag.slice(1, -1)}>`
  const start = bin.indexOf(Buffer.from(tag))
  if (start < 0) die(`resources.assets 中找不到 ${tag}`)
  const end = bin.indexOf(Buffer.from(close), start)
  if (end < 0) die(`${tag} 未闭合`)
  return bin.slice(start, end + close.length).toString('utf8')
}
function parseXmlItems(xml) {
  const out = []
  for (const m of xml.matchAll(/<Item\s+([^>]+?)\/>/g)) {
    const attrs = {}
    for (const am of m[1].matchAll(/([\w]+)="([^"]*)"/g)) attrs[am[1]] = am[2]
    out.push(attrs)
  }
  return out
}
function xmlUnescape(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}
function num(v) { return parseInt(v, 10) || 0 }
function die(msg) { console.error(msg); process.exit(1) }
function parseArgs(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1]
  return o
}

// ---------- Phase 2: AssetRipper 导出 ----------
let server = null
if (RIPPER && !args.export) {
  fs.rmSync(EXPORT, { recursive: true, force: true })
  server = spawn(RIPPER, ['--headless=true', `--port=${PORT}`], { stdio: 'ignore' })
  await waitHttp(PORT, 30000)
  await post(PORT, '/LoadFolder', { path: path.dirname(GAME) })
  console.log('AssetRipper 加载完成，开始导出（可能需要几分钟）...')
  await post(PORT, '/Export/PrimaryContent', { path: EXPORT })
  server.kill()
  console.log('导出完成:', EXPORT)
}

// ---------- Phase 3: 裁切/拷贝图像 ----------
const texDir = path.join(EXPORT, 'Assets', 'Texture2D')
const spriteDir = path.join(EXPORT, 'Assets', 'Sprite')
const imgOut = path.join(OUT, 'src', 'renderer', 'src', 'assets', 'game')
fs.rmSync(imgOut, { recursive: true, force: true })
fs.mkdirSync(imgOut, { recursive: true })

const stats = { copied: 0, cropped: 0, missing: 0 }

function copyPng(srcName, outName) {
  const src = path.join(texDir, `${srcName}.png`)
  if (!fs.existsSync(src)) { stats.missing++; return false }
  fs.copyFileSync(src, path.join(imgOut, `${outName}.png`))
  stats.copied++
  return true
}

function cropSprite(spriteBase, texName, outName) {
  const jsonPath = path.join(spriteDir, `${spriteBase}.json`)
  const texPath = path.join(texDir, `${texName}.png`)
  if (!fs.existsSync(jsonPath) || !fs.existsSync(texPath)) { stats.missing++; return false }
  const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const r = meta.m_RD.m_TextureRect
  const png = PNG.sync.read(fs.readFileSync(texPath))
  const x = Math.floor(r.m_X), w = Math.ceil(r.m_Width), h = Math.ceil(r.m_Height)
  const y = Math.floor(png.height - r.m_Y - r.m_Height) // Unity 左下原点 → PNG 左上
  const out = new PNG({ width: w, height: h })
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const si = ((y + py) * png.width + (x + px)) << 2
      const di = (py * w + px) << 2
      for (let k = 0; k < 4; k++) out.data[di + k] = png.data[si + k]
    }
  }
  fs.writeFileSync(path.join(imgOut, `${outName}.png`), PNG.sync.write(out))
  stats.cropped++
  return true
}

// 机体/飞船: 92 种 → mapUnit<model>_0 裁切
for (const u of unitTypes) cropSprite(`mapUnit${u.model}_0`, `mapUnit${u.model}`, `unit-${u.id}`)

// 驾驶员头像: 独立贴图优先
for (const c of characters) {
  if (!copyPng(`portrait${c.portrait}`, `portrait-${c.id}`)) cropSprite(`portrait${c.portrait}`, `portrait${c.portrait}`, `portrait-${c.id}`)
}

// 装备图标: 贴图集内 sprite 下标为 icon-1（图标 1..16 ↔ itemIcon_0..15，经视觉比对确认）
for (const it of items) cropSprite(`itemIcon_${it.icon - 1}`, 'itemIcon', `item-${it.id}`)

// 军团旗帜 + 传统图标（存在才拷）
for (let n = 0; n <= 33; n++) copyPng(`flagRound${n}`, `flag-round-${n}`)
for (let n = 0; n <= 11; n++) cropSprite(`traditionIcon_${n}`, 'traditionIcon', `tradition-${n}`)

// ---------- Phase 4: game-data.json ----------
const gameData = { unitTypes, characters, items, armies, levelTables, unitMaxExp }
const jsonPath = path.join(OUT, 'src', 'common', 'data', 'game-data.json')
fs.mkdirSync(path.dirname(jsonPath), { recursive: true })
fs.writeFileSync(jsonPath, JSON.stringify(gameData, null, 2) + '\n', 'utf8')

console.log('完成:', JSON.stringify(stats), '| unitTypes:', unitTypes.length, '| characters:', characters.length, '| items:', items.length, '| armies:', armies.length)
if (unitTypes.length !== 92) die('机型数量异常（应为 92），检查提取')

function waitHttp(port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/' }, (res) => { res.resume(); resolve() })
      req.on('error', () => {
        if (Date.now() - t0 > timeoutMs) reject(new Error('AssetRipper 启动超时'))
        else setTimeout(tick, 1000)
      })
    }
    tick()
  })
}
function post(port, p, body) {
  const data = new URLSearchParams(body).toString()
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      res.resume()
      res.statusCode < 400 ? resolve() : reject(new Error(`${p} -> ${res.statusCode}`))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}
