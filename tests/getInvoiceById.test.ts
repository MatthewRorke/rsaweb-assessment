import { describe, it, expect } from 'vitest';
import { processIncomingPaymentPayload, getInvoiceById } from '../src/services';
import { InvoiceRequest, InternalInvoiceStatus, APITransactionStatus } from '../src/structs';

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

describe('Process invoice responses', () => {
  const persistentInvoiceId = generateInvoiceId();
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
});

describe("Process refund after failure", () => {
    const persistentInvoiceId = generateInvoiceId();
    it("should remain a failure if payment.failed with no payment.succeeded after a refund.issued", () => {
      const payload_1 = generatePayload({
        event_type: APITransactionStatus.FAILED,
        invoice_id: persistentInvoiceId,
      });
      const payload_2 = generatePayload({
        event_type: APITransactionStatus.REFUNDED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload_1);
      processIncomingPaymentPayload(payload_2);
      const invoice = getInvoiceById(persistentInvoiceId);
      expect(invoice).toBeDefined();
      expect(invoice.status).toBe(InternalInvoiceStatus.FAILED);
    })
});
