import { activeInvoices } from "./data";
import InvoiceNotFoundError from "./exceptions/InvoiceNotFoundError";
import { getStatus } from "./helpers";
import { InternalInvoiceStatus, Invoice, InvoiceRequest } from "./structs";

export function processIncomingPaymentPayload(invoiceRequest: InvoiceRequest) {
  const {
    event_id: eventId,
    invoice_id: invoiceId
  } = invoiceRequest;
  
  if(!(invoiceId in activeInvoices)) {
    activeInvoices[invoiceId] = {
      status: InternalInvoiceStatus.UNPAID,
      eventHistory: {}
    }
  }

  // Allow overwriting of duplicate events.
  // Alternative logging could be set up for a full audit trail of duplicate requests
  activeInvoices[invoiceId].eventHistory[eventId] = invoiceRequest;

  // always append the current event history item before checking status
  const status: Invoice['status'] = getStatus(activeInvoices[invoiceId]);
  activeInvoices[invoiceId].status = status;
}

export function getInvoiceById(invoiceId: InvoiceRequest['invoice_id']) {
  if(!(invoiceId in activeInvoices)) {
    throw new InvoiceNotFoundError(invoiceId);
  }
  return activeInvoices[invoiceId];
}