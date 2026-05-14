---
title: "Provider Bios & Public Profiles"
order: 10
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
