'use strict'

/**
 * Build ordered nav rows for spec versions: current ratified first, other
 * ratified (newest-first order), then drafts sorted alphabetically (with
 * "-draft" stripped from labels). Drafts are versions whose canonical
 * `version` string contains "-draft" (case-insensitive).
 */
module.exports = function specVersionNavItems (versions, latest) {
  if (!Array.isArray(versions) || versions.length === 0) {
    return []
  }

  const indexOf = new Map()
  versions.forEach((v, i) => indexOf.set(v, i))

  const isDraft = (v) => {
    const s = v && typeof v.version === 'string' ? v.version : ''
    return /-draft/i.test(s)
  }

  const stripDraft = (v) => {
    const raw = (v && v.displayVersion) || (v && v.version) || ''
    const t = String(raw).replace(/-draft/gi, '').replace(/--+/g, '-').replace(/^[-+]+|[-+]+$/g, '')
    return t || raw
  }

  const released = versions.filter((v) => !isDraft(v))
  const drafts = versions.filter((v) => isDraft(v))

  drafts.sort((a, b) => stripDraft(a).localeCompare(stripDraft(b), undefined, { numeric: true, sensitivity: 'base' }))

  const sameVersion = (a, b) =>
    a === b || (a && b && a.version === b.version && a.version)

  const out = []

  if (released.length > 0) {
    let current
    if (latest && !isDraft(latest)) {
      current =
        released.find((v) => sameVersion(v, latest)) ||
        released.reduce((best, v) => (indexOf.get(v) < indexOf.get(best) ? v : best))
    } else {
      current = released.reduce((best, v) => (indexOf.get(v) < indexOf.get(best) ? v : best))
    }

    const others = released.filter((v) => !sameVersion(v, current))
    others.sort((a, b) => indexOf.get(a) - indexOf.get(b))

    out.push({ kind: 'current', v: current, versionText: String(current.displayVersion || current.version || '') })
    for (const v of others) {
      out.push({ kind: 'released', v, versionText: String(v.displayVersion || v.version || '') })
    }
  }

  for (const v of drafts) {
    out.push({ kind: 'draft', v, versionText: stripDraft(v) })
  }

  return out
}
