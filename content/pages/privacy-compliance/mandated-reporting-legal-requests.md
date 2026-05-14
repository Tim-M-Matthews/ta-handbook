---
title: "Mandated Reporting & Legal Requests"
order: 60
description: "Mandated reporting, subpoenas, records requests, and when staff should escalate."
---
#### Code sample (TypeScript)

```typescript
interface Ack {
  signedAt: string;
  employeeId: string;
}

export function isComplete(a: Ack): boolean {
  return Boolean(a.signedAt && a.employeeId);
}
```
