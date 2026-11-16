# Notifications and User Feedback Model

## 1. Product rule

Notifications report real events; they do not make the interface appear active. Never show a fabricated bell count or sample notification. If review is synchronous and no event model exists, use inline status feedback and omit a separate notification center.

## 2. Qualifying events

If asynchronous processing is implemented, candidate events include review completed, review failed and account/security events the application actually detects. Each event has a genuine source transition and authenticated owner. Avoid notification noise for minor editor actions.

## 3. Data model when justified

A persisted notification includes ID, owner, event type, source entity reference, safe display text, created timestamp, optional read timestamp and lifecycle metadata. Do not copy submitted code or full AI output into notification content. Index by owner and created/read state. Create notification data within the reliable event workflow, using a transaction/outbox strategy when required.

## 4. Interactions

- Open: navigate to relevant report/account screen after authorization.
- Mark read: persist if server-backed/cross-device.
- Mark all read: only update current user's notifications.
- Dismiss/delete: only if policy and behavior are defined.
- Unread count: derive from a real query, never hardcode.

## 5. Delivery

In-app is default. Email/push are out of first release unless real provider, consent, unsubscribe and operational support exist. Do not expose email preferences without email delivery.

## 6. Failure

Notification fetch failure is not zero notifications. Show a retryable error or hide optional area with clear failure. Report remains accessible if notification fetch fails.

## 7. Testing

Test event creation from real lifecycle transition, owner isolation, unread count, read mutation, deletion policy, duplicate event handling, navigation target and database failure. Confirm no event appears without a source event.
