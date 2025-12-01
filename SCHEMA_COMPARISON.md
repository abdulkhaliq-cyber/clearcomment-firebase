# Firestore Schema Comparison & Migration Guide

## ✅ What You HAVE vs. What You NEED

### 1. **USERS Collection** ✅ MOSTLY GOOD

**Current:**
```
users/{uid}
- uid (string)
- name (string)
- email (string)
- photoURL (string)
- role (string)
```

**Optimal:**
```
users/{uid}
- uid (string) ✅
- name (string) ✅
- email (string) ✅
- createdAt (timestamp) ❌ MISSING
- role (string) ✅
- connectedPages (array) ❌ MISSING
```

**Action Needed:**
- Add `createdAt` timestamp field
- Add `connectedPages` array to track which pages user manages
- Remove `photoURL` (not essential, can get from Firebase Auth)

---

### 2. **PAGES Collection** ⚠️ NEEDS UPDATES

**Current:**
```
pages/{pageId}
- pageId (string)
- pageName (string)
- userId (string)
- accessToken (string)
- moderationEnabled (boolean)
```

**Optimal:**
```
pages/{pageId}
- pageId (string) ✅
- pageName (string) ✅
- pageToken (string) ✅ (you have accessToken)
- connectedBy (string) ✅ (you have userId)
- connectedAt (timestamp) ❌ MISSING
- webhookStatus (string) ❌ MISSING
- autoModeration (boolean) ✅ (you have moderationEnabled)
```

**Action Needed:**
- Rename `userId` → `connectedBy` (for clarity)
- Rename `accessToken` → `pageToken` (standard naming)
- Rename `moderationEnabled` → `autoModeration` (consistency)
- Add `connectedAt` timestamp
- Add `webhookStatus` ('active', 'disabled', 'error')

---

### 3. **COMMENTS Collection** ⚠️ MAJOR GAPS

**Current:**
```
comments/{commentId}
- commentId (string)
- pageId (string)
- content (string)
- authorId (string)
- createdAt (timestamp)
- status (string)
- moderatedBy (string)
```

**Optimal:**
```
comments/{commentId}
- commentId (string) ✅
- pageId (string) ✅
- postId (string) ❌ MISSING
- message (string) ✅ (you have content)
- fromName (string) ❌ MISSING
- fromId (string) ✅ (you have authorId)
- status (string) ✅
- aiResult (map) ❌ MISSING
- ruleMatched (string) ❌ MISSING
- actionTaken (string) ❌ MISSING
- replyText (string) ❌ MISSING
- createdAt (timestamp) ✅
- receivedAt (timestamp) ❌ MISSING
- updatedAt (timestamp) ❌ MISSING
```

**Action Needed:**
- Rename `content` → `message` (FB API standard)
- Rename `authorId` → `fromId` (FB API standard)
- Add `postId` (which post the comment is on)
- Add `fromName` (author's display name)
- Add `aiResult` (toxicity scores if using AI)
- Add `ruleMatched` (which rule triggered action)
- Add `actionTaken` ('hide', 'ignore', 'reply')
- Add `replyText` (if auto-replied)
- Add `receivedAt` (when webhook received it)
- Add `updatedAt` (when status changed)
- Update `moderatedBy` → use `actionTaken` instead

---

### 4. **RULES Collection** ⚠️ NEEDS EXPANSION

**Current:**
```
rules/{ruleId}
- ruleId (string)
- pageId (string)
- type (string)
- keyword (string)
- replyText (string)
- isEnabled (boolean)
```

**Optimal:**
```
rules/{ruleId}
- pageId (string) ✅
- name (string) ❌ MISSING
- triggerType (string) ✅ (you have type)
- keywords (array<string>) ⚠️ (you have single keyword)
- action (string) ✅ (you have type)
- replyText (string) ✅
- enabled (boolean) ✅ (you have isEnabled)
- createdAt (timestamp) ❌ MISSING
- createdBy (string) ❌ MISSING
```

**Action Needed:**
- Add `name` field (user-friendly rule name)
- Rename `type` → `triggerType` AND `action` (separate trigger from action)
- Change `keyword` (string) → `keywords` (array) for multiple keywords
- Rename `isEnabled` → `enabled` (simpler)
- Add `createdAt` timestamp
- Add `createdBy` (user UID who created the rule)
- Remove `ruleId` field (it's already the document ID)

---

### 5. **LOGS Collection** ⚠️ WRONG STRUCTURE

**Current:**
```
logs/{logId}
- actionId (string)
- commentId (string)
- ruleId (string)
- userId (string)
- actionType (string)
- timestamp (timestamp)
```

**Optimal:**
```
actionLogs/{logId}
- commentId (string) ✅
- pageId (string) ❌ MISSING
- action (string) ✅ (you have actionType)
- ruleId (string) ✅
- text (string) ❌ MISSING
- timestamp (timestamp) ✅
- performedBy (string) ✅ (you have userId)
```

**Action Needed:**
- Rename collection `logs` → `actionLogs` (clearer purpose)
- Add `pageId` (critical for querying logs by page)
- Rename `actionType` → `action` (simpler)
- Rename `userId` → `performedBy` (can be 'system' or UID)
- Add `text` field (for reply text or extra info)
- Remove `actionId` (it's the document ID)

---

### 6. **SETTINGS Collection** ❌ COMPLETELY MISSING

**You Don't Have This Yet!**

**Optimal:**
```
settings/{userId}
- aiModeration (boolean)
- aiThreshold (number)
- autoHide (boolean)
- autoReply (boolean)
- dailySummaryEmail (boolean)
```

**Action Needed:**
- Create new `settings` collection
- Add per-user settings document

---

## 🔥 **Required Firestore Indexes**

### Current Index:
```
comments: pageId ASC, status ASC, createdAt DESC
```

### Optimal Indexes:
```
1. comments: pageId ASC, createdAt DESC
2. rules: pageId ASC, createdAt DESC
3. actionLogs: pageId ASC, timestamp DESC
```

**Action:** Update `firestore.indexes.json`

---

## 📋 **Migration Checklist**

### High Priority (Do First):
- [ ] Add `postId` to comments
- [ ] Add `fromName` to comments
- [ ] Add `pageId` to actionLogs
- [ ] Add `actionTaken`, `ruleMatched` to comments
- [ ] Change `keyword` to `keywords` array in rules
- [ ] Add `webhookStatus` to pages

### Medium Priority:
- [ ] Add timestamps (`createdAt`, `receivedAt`, `updatedAt`)
- [ ] Add `name` field to rules
- [ ] Rename fields for consistency
- [ ] Create `settings` collection

### Low Priority:
- [ ] Add `aiResult` to comments
- [ ] Add `connectedPages` to users
- [ ] Clean up unused fields

---

## 🚀 **Next Steps**

Would you like me to:

1. ✅ **Generate updated Firestore Security Rules** with the new schema
2. ✅ **Create migration scripts** to update existing data
3. ✅ **Update firestore.indexes.json** with optimal indexes
4. ✅ **Generate TypeScript types** for all collections
5. ✅ **Update your Railway worker** to use the new field names
6. ✅ **Update your frontend components** to use the new schema

Let me know which you want first!
