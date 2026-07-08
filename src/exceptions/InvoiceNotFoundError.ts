export default class InvoiceNotFoundError extends Error {
  override name: string = 'InvoiceNotFoundError';

  constructor(invoiceId: string = "Resource not found") {
    // Not memory efficient, but more maintainable than concatenating
    super(`invoiceId not found: ${invoiceId}`);
  }
}