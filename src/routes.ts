import { getInvoiceById, processIncomingPaymentPayload } from "./services";
import { InvoiceRequest } from "./structs";
import { Request, Response, Router } from 'express';
import InvoiceNotFoundError from "./exceptions/InvoiceNotFoundError";

export const router = Router();

router.post('/webhooks/payflow', (req: Request, res: Response): void => {
  const invoiceRequest = req.body as InvoiceRequest;
  processIncomingPaymentPayload(invoiceRequest);    

  // Any true important error logging would occur here, and not in the HTTP response.

  // response to please the webhook client and remain ambigious for security. Most webhooks expect a 200 on success anyway.
  res.status(200).end();
});

router.get('/invoices/:id', (req: Request, res: Response): void => {
  const invoiceId: InvoiceRequest['invoice_id'] = req.params.id as InvoiceRequest['invoice_id'];
  try {
    const invoice = getInvoiceById(invoiceId);
    res.status(200).json(invoice);
  } catch(error: unknown) {
    if(error instanceof InvoiceNotFoundError) {
        res.status(404).json({ message: error.message });
    } else {
        // logging for unrecognised internal failure goes here

        res.status(500).end();
    }
  }
});