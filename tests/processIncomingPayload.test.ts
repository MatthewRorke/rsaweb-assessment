import { describe, it, expect } from 'vitest';
import { processIncomingPaymentPayload } from '../src/services';
import { InvoiceRequest, InternalInvoiceStatus, APITransactionStatus } from '../src/structs';
import * as dataModule from '../src/data';

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

describe('Payment service refunded', () => {
  let persistentInvoiceId = generateInvoiceId();

  it('should create a new invoice with unpaid status', () => {
    const payload = generatePayload({
      event_type: undefined, // force undefined to fallback to unpaid,
      invoice_id: persistentInvoiceId
    });
    processIncomingPaymentPayload(payload);

    const invoice = dataModule.activeInvoices[persistentInvoiceId];
    expect(invoice).toBeDefined();
    expect(invoice.status).toBe(InternalInvoiceStatus.UNPAID);
  });

  it('should transition invoice to failed on payment.failed event', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.FAILED);
  });

  it('should ignore payment.refund request to unpaid invoice event', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.REFUNDED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.FAILED);
  });

  it('should transition invoice to refund on payment.succeeded where payment.refunded record already exists on event', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.SUCCEEDED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
  });

  it('should ignore undefined request to already-refunded invoice', () => {
    const payload = generatePayload({
      event_type: undefined,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
  });

  it('should ignore payment.failed request to already-refunded invoice', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
  });
});
describe('Payment service success', () => {
  const generateInvoiceId = (): string => (
    `inv_${Math.random().toString(36).substring(7)}`
  );

  let persistentInvoiceId = generateInvoiceId();
  it('should transition invoice to failed on payment.failed event', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.FAILED);
  });

  it('should transition invoice to paid on payment.succeeded event', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.SUCCEEDED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.PAID);
  });

  it('should ignore payment.failed to paid invoice', () => {
    const payload = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: persistentInvoiceId,
    });

    processIncomingPaymentPayload(payload);
    expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.PAID);
  });

  it('should ignore duplicate requests', () => {
    const tempInvoice = generateInvoiceId();
    const tempEventId = crypto.randomUUID();
    const payload_1 = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: tempInvoice,
      event_id: tempEventId
    });
    const payload_2 = generatePayload({
      event_type: APITransactionStatus.FAILED,
      invoice_id: tempInvoice,
      event_id: tempEventId
    });
    processIncomingPaymentPayload(payload_1);
    processIncomingPaymentPayload(payload_2);

    expect(dataModule.activeInvoices[tempInvoice].status).toBe(InternalInvoiceStatus.FAILED);
    expect(Object.keys(dataModule.activeInvoices[tempInvoice].eventHistory)).toHaveLength(1);
  });
});
