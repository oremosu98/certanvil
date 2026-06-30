---
type: process
status: active
cert: all
updated: 2026-06-30
tags: [convention, dashboard]
up: "[[Home]]"
---
# CertAnvil — Live Dashboard

> Auto-generated views over every note's frontmatter (`type` / `status` / `cert` / `updated`). Nothing here is maintained by hand — add a note with frontmatter and it shows up. Requires the **Dataview** plugin (already installed). Pairs with [[Home]] (the curated map) and the **Code ↔ Decisions** canvas (the visual board).

## 🔴 Active work (not yet shipped)
```dataview
TABLE WITHOUT ID file.link AS "Note", type, cert, updated
FROM "docs" OR "."
WHERE status = "active" AND type != "process"
SORT updated DESC
```

## 🕐 Recently touched (last 15)
```dataview
TABLE WITHOUT ID file.link AS "Note", type, status, updated
FROM "docs" OR "."
WHERE updated
SORT updated DESC
LIMIT 15
```

## ⚖️ All decisions
```dataview
TABLE WITHOUT ID file.link AS "Decision", status, cert, updated
WHERE type = "decision" OR contains(tags, "decision")
SORT updated DESC
```

## 📋 Plans & specs in flight
```dataview
TABLE WITHOUT ID file.link AS "Note", type, cert, updated
WHERE (type = "plan" OR type = "spec") AND status = "active"
SORT updated DESC
```

## 🧹 Possibly stale (active, untouched 45+ days)
```dataview
TABLE WITHOUT ID file.link AS "Note", type, updated
WHERE status = "active" AND updated AND (date(today) - date(updated)).days > 45
SORT updated ASC
```

## 📊 Note inventory by type
```dataview
TABLE WITHOUT ID rows.type AS "Type", length(rows) AS "Count"
WHERE type
GROUP BY type
SORT length(rows) DESC
```

## Related
[[Home]] · [[Decisions MOC]] · [[Decision Log]] · [[Drills MOC]] · [[Mobile MOC]] · [[Design MOC]]
