# RSA Web Assessment

A TypeScript/Express payment webhook processor that manages invoice payment events and their state transitions, built for RSA Web by Matthew Rorke.

## Overview

This service processes incoming payment webhook events (succeeded, failed, refunded) and maintains invoice state based on a defined state machine. It provides endpoints to receive payment events and retrieve invoice information with full event history.

## Development Notes

- Events can arrive in any order (failure → success → failure → refund, etc.)
- The same `event_id` with identical payload can be submitted multiple times.
- Storage is done in memory, where normally there would be persistent disk-based storage for things that would, otherwise, be considered "memory heavy".
- Status transitions are immutable once in certain states (e.g., PAID/REFUNDED invoices cannot fail)
- Event history is preserved regardless of status transitions for audit purposes, to demonstrate my understanding of financial audit trails. The brief stated only to store "PAID" events, but also asked to display the entire history, so I used my discretion to store everything.
- AI usage was intentionally neglected in order to demonstrate the code understanding. The only place AI was used was in assistance of creating this README file.
- There are definitely areas of room for improvement and additional testing criteria that could be added in an environment where the scope/brief could be discussed in greater detail.
- The only additional place that could've been improved would be handling of the timestamps for a nicer end-user experience, but this would create a compute overhead that may not be truly needed if there is a frontend able to offset this logic to the clientside. 

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Testing**: Vitest
- **Task Runner**: npm


## Installation

```bash
npm install
```

## Running the Application

```bash
npm start
```

Starts the server on the default Express port (typically 3000).

## Testing

```bash
# Run all tests
npm test

# Run all tests in watch mode
npm run test:watch
```

## Project Structure

```
src/
  ├── index.ts              # Application entry point
  ├── server.ts             # Express server configuration
  ├── services.ts           # Core business logic (processIncomingPaymentPayload, getInvoiceById)
  ├── routes.ts             # API endpoint definitions
  ├── helpers.ts            # Status transition logic
  ├── structs.ts            # TypeScript interfaces and enums
  ├── data.ts               # In-memory invoice storage
  └── exceptions/
      └── InvoiceNotFoundError.ts

tests/
  └── *.test.ts             # Test suites
```

## API Endpoints

### POST `/webhooks/payflow`

Receives payment event webhooks and processes invoice state transitions.

**Request Body:**
```json
{
  "event_id": "a893c6b9-a394-46d1-b2ac-000c8e2bd821",
  "event_type": "payment.succeeded",
  "invoice_id": "inv_10234",
  "amount": 4999,
  "currency": "ZAR",
  "occurred_at": "2026-07-01T09:15:00Z"
}
```

**Event Types:**
- `payment.succeeded` — Payment processed successfully → Invoice status: PAID
- `payment.failed` — Payment failed → Invoice status: FAILED
- `refund.issued` — Refund issued → Invoice status: REFUNDED

**Response:**
- Status: `200 OK` (regardless of processing outcome for security/webhook compliance)

### GET `/invoices/:id`

Retrieves invoice details including full event history.

**Response (200 OK):**
```json
{
  "status": "paid",
  "eventHistory": {
    "event-id-1": [
      {
        "event_id": "event-id-1",
        "event_type": "payment.failed",
        "invoice_id": "inv_10234",
        "amount": 4999,
        "currency": "ZAR",
        "occurred_at": "2026-07-01T09:15:00Z"
      }
    ],
    "event-id-2": [
      {
        "event_id": "event-id-2",
        "event_type": "payment.succeeded",
        "invoice_id": "inv_10234",
        "amount": 4999,
        "currency": "ZAR",
        "occurred_at": "2026-07-01T09:15:00Z"
      }
    ]
  }
}
```

**Response (404 Not Found):**
```json
{
  "message": "Invoice not found: inv_10234"
}
```
