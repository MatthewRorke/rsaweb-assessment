import { APITransactionStatus, InternalInvoiceStatus, Invoice, InvoiceRequest } from "./structs";

export function getStatus(eventType: InvoiceRequest['event_type'], currentStatus: Invoice['status']): Invoice['status'] {
  let status = currentStatus ?? InternalInvoiceStatus.UNPAID;
  if(eventType == APITransactionStatus.SUCCEEDED && status != InternalInvoiceStatus.REFUNDED) {
    status = InternalInvoiceStatus.PAID;
  } else if(eventType == APITransactionStatus.FAILED
    && currentStatus != InternalInvoiceStatus.PAID
    && currentStatus != InternalInvoiceStatus.REFUNDED
  ) {
    status = InternalInvoiceStatus.FAILED;
  } else if(eventType == APITransactionStatus.REFUNDED && currentStatus == InternalInvoiceStatus.PAID) {
    status = InternalInvoiceStatus.REFUNDED;
  }  
  return status;
}