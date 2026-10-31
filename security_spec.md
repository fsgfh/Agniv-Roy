# Security Specification: AuraEcho

## 1. Data Invariants
1. **User Identity & PII Isolation**: An anonymous user profile (`/users/{userId}`) can only be created or modified by `request.auth.uid == userId`. Private sensitive information (`/users/{userId}/private/info`) can only be read and written by the owner (`request.auth.uid == userId`). No non-owner can ever read private user records.
2. **Anonymous Emotion Expressions (`/emotions/{emotionId}`)**:
   - Only authenticated users can publish an emotion.
   - `authorId` must strictly equal `request.auth.uid`.
   - Creation requires server timestamp `request.time`.
   - Non-authors can only update `supportCount` and `commentsCount` via counter adjustments; they cannot alter `content`, `authorId`, or `emotionCategory`.
   - Deletion is restricted to the author or admin.
3. **Comments (`/emotions/{emotionId}/comments/{commentId}`)**:
   - Only authenticated users can post a comment.
   - `authorId` must strictly match `request.auth.uid`.
   - Parent emotion must exist.
4. **Reactions (`/emotions/{emotionId}/reactions/{reactionId}`)**:
   - Only authenticated users can react.
   - Document ID must equal `{userId}` or `reactionId` must bind `userId == request.auth.uid`.
5. **Private 1-on-1 Conversations (`/conversations/{conversationId}`)**:
   - Only participants (`participant1Id` or `participant2Id`) can read, list, or send messages in the conversation.
   - Third-party users cannot read or inject messages into other users' private conversations.
   - New conversations can only be created by an authenticated user who is either `participant1Id` or `participant2Id`.
6. **Direct Messages (`/conversations/{conversationId}/messages/{messageId}`)**:
   - `senderId` must strictly equal `request.auth.uid`.
   - Sender must be a recognized participant in the parent conversation.
   - Server timestamp `request.time` is enforced.
7. **Daily Emotional Check-ins (`/users/{userId}/checkins/{checkinId}`)**:
   - Private subcollection. Strictly readable and writable only by the owner `request.auth.uid == userId`.
   - `userId` in payload must match `request.auth.uid`.
   - Mood score bounded between 1 and 10.


## 2. The "Dirty Dozen" Threat Payloads
1. **Spoofed Author**: User attempts to post an emotion with `authorId: "victim_123"` instead of their own auth UID. -> *Must be REJECTED*.
2. **PII Snoop Attack**: Non-owner tries to read `/users/other_user/private/info`. -> *Must be REJECTED*.
3. **Shadow Field Injection**: User sends `{ "pseudonym": "Echo", "isAdmin": true }` to `/users/{userId}`. -> *Must be REJECTED*.
4. **Content Tampering**: User B attempts to edit User A's emotion post content. -> *Must be REJECTED*.
5. **Conversation Eavesdropping**: User C attempts to list or get messages from `/conversations/{convA_B}/messages`. -> *Must be REJECTED*.
6. **Conversation Impersonation**: User C attempts to post a message into conversation A & B. -> *Must be REJECTED*.
7. **Message Sender Forgery**: User A in conversation sends a message with `senderId: "user_B"`. -> *Must be REJECTED*.
8. **Denial of Wallet (Payload Bloat)**: User sends 2MB string in post content. -> *Must be REJECTED by string size constraint*.
9. **Timestamp Forgery**: User sends client past or future date for `createdAt` instead of `request.time`. -> *Must be REJECTED*.
10. **Unauthenticated Public Write**: Unauthenticated client attempts to create an emotion post. -> *Must be REJECTED*.
11. **Malicious ID Traversal**: User attempts document ID with special punctuation/junk characters `../../admin`. -> *Must be REJECTED by isValidId()*.
12. **Status or Membership Hijack**: Non-participant modifies `participant1Id` or `participant2Id` of an existing conversation. -> *Must be REJECTED*.
