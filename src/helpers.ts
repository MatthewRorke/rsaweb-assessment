import { APITransactionStatus, InternalInvoiceStatus, Invoice } from "./structs";

export function getStatus(invoice: Invoice): Invoice['status'] {
  let hasPaid = false;
  let hasRefund = false;
  let hasFail = false;
  for(const eventId in invoice.eventHistory) {
    const eventHistoryItem = invoice.eventHistory[eventId];
    if(eventHistoryItem.event_type == APITransactionStatus.SUCCEEDED) {
      hasPaid = true;
    } else if(eventHistoryItem.event_type == APITransactionStatus.REFUNDED) {
      hasRefund = true;
    } else if(eventHistoryItem.event_type == APITransactionStatus.FAILED) {
      hasFail = true;
    }
  }
  
  if(hasPaid && !hasRefund) {
    return InternalInvoiceStatus.PAID;
  } else if(hasPaid && hasRefund) {
    return InternalInvoiceStatus.REFUNDED;
  } else if(hasFail) {
    return InternalInvoiceStatus.FAILED;
  }
  return InternalInvoiceStatus.UNPAID;
}