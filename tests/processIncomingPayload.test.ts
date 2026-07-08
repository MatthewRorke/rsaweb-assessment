import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processIncomingPaymentPayload, getInvoiceById } from '../src/services';
import { InvoiceRequest, InternalInvoiceStatus, APITransactionStatus } from '../src/structs';
import InvoiceNotFoundError from '../src/exceptions/InvoiceNotFoundError';
import * as dataModule from '../src/data';

describe('Payment Service', () => {
  describe('processIncomingPaymentPayload', () => {
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
  
    it('should transition invoice to paid on payment.succeeded event', () => {
      const payload = generatePayload({
        event_type: APITransactionStatus.SUCCEEDED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.PAID);
    });
  
    it('should ignore undefined request to already-paid invoice', () => {
      const payload = generatePayload({
        event_type: undefined,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.PAID);
    });

    it('should ignore payment.failed request to already-paid invoice', () => {
      const payload = generatePayload({
        event_type: APITransactionStatus.FAILED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.PAID);
    });

    it('should transition invoice to refunded on payment.refunded event', () => {
      const payload = generatePayload({
        event_type: APITransactionStatus.REFUNDED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
    });
    it('should ignore undefined status to refunded invoice', () => {
      const payload = generatePayload({
        event_type: undefined,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
    });

    it('should ignore payment.failed to refunded invoice', () => {
      const payload = generatePayload({
        event_type: APITransactionStatus.FAILED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
    });
  
    it('should ignore payment.succeeded to refunded invoice', () => {
      const payload = generatePayload({
        event_type: APITransactionStatus.SUCCEEDED,
        invoice_id: persistentInvoiceId,
      });

      processIncomingPaymentPayload(payload);
      expect(dataModule.activeInvoices[persistentInvoiceId].status).toBe(InternalInvoiceStatus.REFUNDED);
    });
  
    it('should ignore duplicate requests but still store to event history', () => {
      const tempInvoice = generateInvoiceId();
      const payload_1 = generatePayload({
        event_type: APITransactionStatus.SUCCEEDED,
        invoice_id: tempInvoice,
      });
      const payload_2 = generatePayload({
        event_type: APITransactionStatus.SUCCEEDED,
        invoice_id: tempInvoice,
      });
      processIncomingPaymentPayload(payload_1);
      processIncomingPaymentPayload(payload_2);

      expect(dataModule.activeInvoices[tempInvoice].status).toBe(InternalInvoiceStatus.PAID);
      expect(Object.keys(dataModule.activeInvoices[tempInvoice].eventHistory)).toHaveLength(2);
    });
  });
});
