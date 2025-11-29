# Firestore Database Schema

## Collections

### `/users`
Stores user profile information.
- **Document ID**: `uid` (from Firebase Auth)
- **Fields**:
  - `uid` (string): User ID
  - `name` (string): Display name
  - `email` (string): Email address
  - `photoURL` (string): Profile picture URL
  - `role` (string): 'admin', 'moderator', or 'owner'

### `/pages`
Stores Facebook pages managed by users.
- **Document ID**: `pageId` (Facebook Page ID)
- **Fields**:
  - `pageId` (string): Facebook Page ID
  - `pageName` (string): Name of the page
  - `userId` (string): ID of the user who owns/manages this page
  - `accessToken` (string): Encrypted page access token
  - `moderationEnabled` (boolean): Whether auto-moderation is active

### `/comments`
Stores comments fetched from Facebook.
- **Document ID**: `commentId` (Facebook Comment ID)
- **Fields**:
  - `commentId` (string): Facebook Comment ID
  - `pageId` (string): ID of the page the comment belongs to
  - `content` (string): The comment text
  - `authorId` (string): Facebook User ID of the commenter
  - `createdAt` (timestamp): When the comment was posted
  - `status` (string): 'visible', 'hidden', 'deleted'
  - `moderatedBy` (string): 'auto-rule', 'manual', or null

### `/rules`
Stores automation rules for moderation.
- **Document ID**: `ruleId` (Auto-generated)
- **Fields**:
  - `ruleId` (string): Unique ID
  - `pageId` (string): The page this rule applies to
  - `type` (string): 'block', 'auto-reply', 'hide'
  - `keyword` (string): The keyword to match
  - `replyText` (string): Text to reply with (if type is auto-reply)
  - `isEnabled` (boolean): Whether the rule is active

### `/logs`
Stores audit logs of moderation actions.
- **Document ID**: `logId` (Auto-generated)
- **Fields**:
  - `actionId` (string): Unique ID
  - `commentId` (string): The comment affected
  - `ruleId` (string): The rule that triggered the action (if any)
  - `userId` (string): The user who performed the action (if manual)
  - `actionType` (string): 'hide', 'delete', 'reply'
  - `timestamp` (timestamp): When the action occurred

## Indexes

### `comments`
Composite index for querying comments on a specific page, filtered by status, and sorted by time.
- `pageId` (ASC)
- `status` (ASC)
- `createdAt` (DESC)
