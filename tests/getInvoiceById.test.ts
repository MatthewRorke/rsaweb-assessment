import { describe, it, expect } from 'vitest';
import { processIncomingPaymentPayload, getInvoiceById } from '../src/services';
import { InvoiceRequest, InternalInvoiceStatus, APITransactionStatus } from '../src/structs';

describe('processGetRequestAfterPayloadSubmission', () => {
  const generatePayload = (overrides?: Partial<InvoiceRequest>): InvoiceRequest => ({
    event_id: crypto.randomUUID(),
    event_type: APITransactionStatus.SUCCEEDED,
    invoice_id: `inv_${Math.random().toString(36).substring(7)}`,
    amount: 4999,
    currency: 'ZAR',
    occurred_at: new Date().toISOString(),
    ...overrides,
  });

  const generateInvoiceId = (): string => (
    `inv_${Math.random().toString(36).substring(7)}`
  );

  const persistentInvoiceId = generateInvoiceId();
  const persistentEventId = crypto.randomUUID();
  it('should return an invoice', () => {
    const payload = generatePayload({
      event_type: undefined, // force undefined to fallback to unpaid,
      invoice_id: persistentInvoiceId
    });
    processIncomingPaymentPayload(payload);
    const invoice = getInvoiceById(persistentInvoiceId);
    expect(invoice).toBeDefined();
    expect(invoice.status).toBe(InternalInvoiceStatus.UNPAID);
    expect(Object.keys(invoice.eventHistory)).toHaveLength(1);
  });

  it('should return 3 event history items invoices', () => {
    const payload_1 = generatePayload({
      event_type: APITransactionStatus.SUCCEEDED,
      invoice_id: persistentInvoiceId,
    });
    const payload_2 = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload_1);
    processIncomingPaymentPayload(payload_2);
    const invoice = getInvoiceById(persistentInvoiceId);
    expect(invoice).toBeDefined();
    expect(Object.keys(invoice.eventHistory)).toHaveLength(3);
  });

  it('should return 1 event history items with the single event containing 2 duplicate events for debugging', () => {
    const tempInvoiceId = generateInvoiceId();
    const tempEventId = crypto.randomUUID();
    const payload_1 = generatePayload({
      event_type: APITransactionStatus.SUCCEEDED, // force undefined to fallback to unpaid,
      invoice_id: tempInvoiceId,
      event_id: tempEventId
    });
    const payload_2 = generatePayload({
      event_type: APITransactionStatus.SUCCEEDED, // force undefined to fallback to unpaid,
      invoice_id: tempInvoiceId,
      event_id: tempEventId
    });
    processIncomingPaymentPayload(payload_1);
    processIncomingPaymentPayload(payload_2);
    const invoice = getInvoiceById(tempInvoiceId);
    expect(invoice).toBeDefined();
    expect(invoice.eventHistory[tempEventId]).toHaveLength(2);
  });
});
