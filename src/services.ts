import { activeInvoices } from "./data";
import InvoiceNotFoundError from "./exceptions/InvoiceNotFoundError";
import { getStatus } from "./helpers";
import { InternalInvoiceStatus, Invoice, InvoiceRequest } from "./structs";

export function processIncomingPaymentPayload(invoiceRequest: InvoiceRequest) {
  const {
    event_id: eventId,
    event_type: eventType,
    invoice_id: invoiceId
  } = invoiceRequest;
  
  if(!(invoiceId in activeInvoices)) {
    activeInvoices[invoiceId] = {
      status: InternalInvoiceStatus.UNPAID,
      eventHistory: {}
    }
  }
  const status: Invoice['status'] = getStatus(eventType, activeInvoices[invoiceId].status);

  if(!(eventId in activeInvoices[invoiceId].eventHistory)) {
    activeInvoices[invoiceId].eventHistory[eventId] = [];
  }
  activeInvoices[invoiceId].eventHistory[eventId].push(invoiceRequest);
  activeInvoices[invoiceId].status = status;
}

export function getInvoiceById(invoiceId: InvoiceRequest['invoice_id']) {
  if(!(invoiceId in activeInvoices)) {
    throw new InvoiceNotFoundError(invoiceId);
  }
  return activeInvoices[invoiceId];
}