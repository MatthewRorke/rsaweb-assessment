export enum APITransactionStatus {
  SUCCEEDED = 'payment.succeeded',
  FAILED = 'payment.failed',
  REFUNDED = 'refund.issued'
}

export enum InternalInvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Types
export interface InvoiceRequest {
  event_id: string;
  event_type:  APITransactionStatus;
  invoice_id: string;
  amount: number;
  currency: string; // can enhance with whitelisted currencies
  occurred_at: string;
}

export interface Invoices {
  [invoiceId: string]: Invoice
}

export interface Invoice {
  status: InternalInvoiceStatus;
  // The brief states to only push to the history after a succeeded event is received,
  // but the invoices/:id endpoint requests to be able to return the full event history
  // based on that I am storing every request to event history for this demonstration,
  // normally I would opt for writing this to a database to reduce memory consumption.
  eventHistory: {
    // object driven with eventId as key to prevent duplicate requests. We still store a record of each duplication for debugging and audit trail.
    [eventId: InvoiceRequest['event_id']]: InvoiceRequest
  }
}