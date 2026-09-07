export interface Es3Field {
  __type?: string
  value: unknown
}

export type Es3Doc = Record<string, Es3Field>

export function isWrapped(v: unknown): v is Es3Field {
  return typeof v === 'object' && v !== null && '__type' in v && 'value' in v
}

/** 解析 ES3 JSON；顶层未包装的值也兼容 */
export function parseEs3(text: string): Es3Doc {
  const raw = JSON.parse(text) as Record<string, unknown>
  const doc: Es3Doc = {}
  for (const [k, v] of Object.entries(raw)) {
    doc[k] = isWrapped(v) ? v : { value: v }
  }
  return doc
}

/** 序列化：与游戏 ES3/LitJson 兼容（解析器不关心排版），UTF-8 无 BOM */
export function stringifyEs3(doc: Es3Doc): string {
  return JSON.stringify(doc, null, 2) + '\n'
}

export function getField<T>(doc: Es3Doc, key: string): T {
  const f = doc[key]
  if (!f) throw new Error(`ES3 字段缺失: ${key}`)
  return f.value as T
}

/** 只改 value，保留 __type */
export function setField(doc: Es3Doc, key: string, value: unknown): void {
  const f = doc[key]
  if (!f) throw new Error(`ES3 字段缺失: ${key}`)
  f.value = value
}
