# Firestore Database Schema - Production Ready

## Collections Overview

```
users/{uid}
pages/{pageId}
comments/{commentId}
rules/{ruleId}
actionLogs/{logId}
settings/{userId}
```

---

## 1. USERS Collection

Stores app users (people logging into your dashboard).

**Collection:** `users/{userId}`

| Field            | Type      | Required | Description                    |
| ---------------- | --------- | -------- | ------------------------------ |
| `uid`            | string    | ✅       | Firebase Auth UID              |
| `name`           | string    | ✅       | Display name                   |
| `email`          | string    | ✅       | User email                     |
| `createdAt`      | timestamp | ✅       | Account creation date          |
| `role`           | string    | ✅       | User role (default: 'admin')   |
| `connectedPages` | array     | ❌       | Array of connected page IDs    |

**Example Document:**
```json
{
  "uid": "abc123",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2024-01-15T10:30:00Z",
  "role": "admin",
  "connectedPages": ["page123", "page456"]
}
```

---

## 2. PAGES Collection

Each Facebook Page the user connects.

**Collection:** `pages/{pageId}`

| Field            | Type      | Required | Description                          |
| ---------------- | --------- | -------- | ------------------------------------ |
| `pageId`         | string    | ✅       | Facebook Page ID                     |
| `pageName`       | string    | ✅       | Facebook page name                   |
| `pageToken`      | string    | ✅       | Long-lived page access token         |
| `connectedBy`    | string    | ✅       | User UID who connected this page     |
| `connectedAt`    | timestamp | ✅       | Date when page was connected         |
| `webhookStatus`  | string    | ✅       | 'active', 'disabled', 'error'        |
| `autoModeration` | boolean   | ✅       | Whether automation is enabled        |

**Example Document:**
```json
{
  "pageId": "123456789",
  "pageName": "My Business Page",
  "pageToken": "EAABwz...",
  "connectedBy": "abc123",
  "connectedAt": "2024-01-15T10:30:00Z",
  "webhookStatus": "active",
  "autoModeration": true
}
```

---

## 3. COMMENTS Collection

Main table for Facebook comments (realtime dashboard data).

**Collection:** `comments/{commentId}`

| Field         | Type      | Required | Description                               |
| ------------- | --------- | -------- | ----------------------------------------- |
| `commentId`   | string    | ✅       | Facebook Comment ID                       |
| `pageId`      | string    | ✅       | Page this comment belongs to              |
| `postId`      | string    | ✅       | Facebook Post ID                          |
| `message`     | string    | ✅       | Comment text content                      |
| `fromName`    | string    | ✅       | Author's display name                     |
| `fromId`      | string    | ✅       | Author's Facebook ID                      |
| `status`      | string    | ✅       | 'visible', 'hidden', 'replied', 'deleted' |
| `aiResult`    | map       | ❌       | AI toxicity analysis results              |
| `ruleMatched` | string    | ❌       | Rule ID that triggered action             |
| `actionTaken` | string    | ❌       | 'hide', 'ignore', 'reply', 'delete'       |
| `replyText`   | string    | ❌       | Auto-reply text sent to user              |
| `createdAt`   | timestamp | ✅       | When comment was posted on Facebook       |
| `receivedAt`  | timestamp | ✅       | When webhook received the comment         |
| `updatedAt`   | timestamp | ❌       | Last status change timestamp              |

**Example Document:**
```json
{
  "commentId": "comment_123",
  "pageId": "123456789",
  "postId": "post_456",
  "message": "Great product!",
  "fromName": "Jane Smith",
  "fromId": "user_789",
  "status": "visible",
  "aiResult": {
    "toxicity": 0.05,
    "spam": 0.02
  },
  "ruleMatched": null,
  "actionTaken": "ignore",
  "replyText": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "receivedAt": "2024-01-15T10:30:05Z",
  "updatedAt": null
}
```

**Required Index:**
```
pageId ASC, createdAt DESC
```

---

## 4. RULES Collection

Automation rules for comment moderation.

**Collection:** `rules/{ruleId}`

| Field         | Type          | Required | Description                                        |
| ------------- | ------------- | -------- | -------------------------------------------------- |
| `pageId`      | string        | ✅       | Page this rule applies to                          |
| `name`        | string        | ✅       | User-friendly rule name                            |
| `triggerType` | string        | ✅       | 'keyword', 'match-any', 'match-all', 'regex', 'ai' |
| `keywords`    | array<string> | ✅       | Keywords to match (can be empty for AI rules)      |
| `action`      | string        | ✅       | 'hide', 'reply', 'ignore', 'delete'                |
| `replyText`   | string        | ❌       | Auto-reply message (required if action='reply')    |
| `enabled`     | boolean       | ✅       | Whether rule is active                             |
| `createdAt`   | timestamp     | ✅       | Rule creation date                                 |
| `createdBy`   | string        | ✅       | User UID who created the rule                      |

**Example Document:**
```json
{
  "pageId": "123456789",
  "name": "Block Spam",
  "triggerType": "keyword",
  "keywords": ["spam", "scam", "fake"],
  "action": "hide",
  "replyText": null,
  "enabled": true,
  "createdAt": "2024-01-15T10:30:00Z",
  "createdBy": "abc123"
}
```

**Required Index:**
```
pageId ASC, createdAt DESC
```

---

## 5. ACTION LOGS Collection

Audit trail for all moderation actions.

**Collection:** `actionLogs/{logId}`

| Field         | Type      | Required | Description                                |
| ------------- | --------- | -------- | ------------------------------------------ |
| `commentId`   | string    | ✅       | Comment that was acted upon                |
| `pageId`      | string    | ✅       | Page the comment belongs to                |
| `action`      | string    | ✅       | 'hide', 'reply', 'delete', 'rule-fired'    |
| `ruleId`      | string    | ❌       | Rule ID (if action was triggered by rule)  |
| `text`        | string    | ❌       | Reply text or additional info              |
| `timestamp`   | timestamp | ✅       | When action occurred                       |
| `performedBy` | string    | ✅       | 'system' or user UID                       |

**Example Document:**
```json
{
  "commentId": "comment_123",
  "pageId": "123456789",
  "action": "hide",
  "ruleId": "rule_456",
  "text": "Comment hidden by spam filter",
  "timestamp": "2024-01-15T10:30:00Z",
  "performedBy": "system"
}
```

**Required Index:**
```
pageId ASC, timestamp DESC
```

---

## 6. SETTINGS Collection

Per-user application settings.

**Collection:** `settings/{userId}`

| Field               | Type    | Required | Description                       |
| ------------------- | ------- | -------- | --------------------------------- |
| `aiModeration`      | boolean | ✅       | Enable AI-powered moderation      |
| `aiThreshold`       | number  | ✅       | AI toxicity threshold (0.0 - 1.0) |
| `autoHide`          | boolean | ✅       | Auto-hide flagged comments        |
| `autoReply`         | boolean | ✅       | Enable auto-reply feature         |
| `dailySummaryEmail` | boolean | ✅       | Send daily summary emails         |

**Example Document:**
```json
{
  "aiModeration": true,
  "aiThreshold": 0.7,
  "autoHide": true,
  "autoReply": false,
  "dailySummaryEmail": true
}
```

---

## Required Firestore Indexes

### Composite Indexes

1. **comments** collection:
   - `pageId` (Ascending) + `createdAt` (Descending)

2. **rules** collection:
   - `pageId` (Ascending) + `createdAt` (Descending)

3. **actionLogs** collection:
   - `pageId` (Ascending) + `timestamp` (Descending)

---

## Security Considerations

- All write operations to `comments` and `actionLogs` should be done by backend only
- Users can only read/write their own data
- Page access is restricted to the user who connected it
- Rules can only be created/modified by page owners
- Settings are private to each user

---

## Migration Notes

### From Old Schema to New Schema:

**Field Renames:**
- `content` → `message` (in comments)
- `authorId` → `fromId` (in comments)
- `userId` → `connectedBy` (in pages)
- `accessToken` → `pageToken` (in pages)
- `moderationEnabled` → `autoModeration` (in pages)
- `type` → `action` (in rules)
- `keyword` → `keywords` (in rules, now array)
- `isEnabled` → `enabled` (in rules)
- `logs` → `actionLogs` (collection rename)
- `actionType` → `action` (in actionLogs)
- `userId` → `performedBy` (in actionLogs)

**New Required Fields:**
- `postId`, `fromName`, `receivedAt` in comments
- `connectedAt`, `webhookStatus` in pages
- `name`, `triggerType`, `createdBy` in rules
- `pageId` in actionLogs
- Entire `settings` collection

---

## Query Examples

### Get all comments for a page:
```javascript
const q = query(
  collection(db, 'comments'),
  where('pageId', '==', pageId),
  orderBy('createdAt', 'desc')
);
```

### Get active rules for a page:
```javascript
const q = query(
  collection(db, 'rules'),
  where('pageId', '==', pageId),
  where('enabled', '==', true)
);
```

### Get recent action logs:
```javascript
const q = query(
  collection(db, 'actionLogs'),
  where('pageId', '==', pageId),
  orderBy('timestamp', 'desc'),
  limit(50)
);
```
