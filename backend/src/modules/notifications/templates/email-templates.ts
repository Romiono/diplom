import * as Handlebars from 'handlebars';

interface TemplateDef {
  subject: string;
  body: string;
}

const TEMPLATES: Record<string, TemplateDef> = {
  'transaction-created': {
    subject: 'New purchase request for "{{listingTitle}}"',
    body: `
<h2>New Purchase Request</h2>
<p>A buyer has initiated a purchase for your listing <strong>{{listingTitle}}</strong>.</p>
<p>Amount: <strong>{{amount}} TON</strong></p>
<p>The escrow contract has been deployed. Waiting for the buyer to complete the payment.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace</p>
    `,
  },

  'transaction-paid': {
    subject: 'Payment received for "{{listingTitle}}"',
    body: `
<h2>Payment Received</h2>
<p>The buyer has completed payment for <strong>{{listingTitle}}</strong>.</p>
<p>Amount: <strong>{{amount}} TON</strong></p>
<p>Funds are held in escrow. Please prepare for delivery.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace</p>
    `,
  },

  'transaction-completed': {
    subject: 'Transaction completed — "{{listingTitle}}"',
    body: `
<h2>Transaction Completed</h2>
<p>The transaction for <strong>{{listingTitle}}</strong> has been completed successfully.</p>
<p>Amount: <strong>{{amount}} TON</strong></p>
<p>The funds have been released from escrow.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace</p>
    `,
  },

  'transaction-disputed': {
    subject: 'Dispute opened — "{{listingTitle}}"',
    body: `
<h2>Dispute Opened</h2>
<p>A dispute has been opened for the transaction regarding <strong>{{listingTitle}}</strong>.</p>
<p>Reason: <em>{{reason}}</em></p>
<p>Our administrators will review the case and resolve it shortly.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace</p>
    `,
  },

  'transaction-refunded': {
    subject: 'Refund processed — "{{listingTitle}}"',
    body: `
<h2>Refund Processed</h2>
<p>Your transaction for <strong>{{listingTitle}}</strong> has been refunded.</p>
<p>Amount: <strong>{{amount}} TON</strong></p>
<p>The funds will be returned to your wallet shortly.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace</p>
    `,
  },

  'dispute-admin': {
    subject: '[Action Required] Dispute opened — "{{listingTitle}}"',
    body: `
<h2>New Dispute Requires Review</h2>
<p>A dispute has been opened for transaction <code>{{transactionId}}</code>.</p>
<p>Listing: <strong>{{listingTitle}}</strong></p>
<p>Reason: <em>{{reason}}</em></p>
<p>Please log in and resolve this dispute.</p>
<hr/>
<p style="color:#888;font-size:12px;">TON Marketplace — Admin Notification</p>
    `,
  },
};

export interface CompiledEmail {
  subject: string;
  html: string;
}

export function compileEmail(
  templateName: string,
  data: Record<string, any>,
): CompiledEmail {
  const tpl = TEMPLATES[templateName];
  if (!tpl) {
    throw new Error(`Unknown email template: ${templateName}`);
  }
  return {
    subject: Handlebars.compile(tpl.subject)(data),
    html: Handlebars.compile(tpl.body)(data),
  };
}

export function getTemplateSubject(
  templateName: string,
  data: Record<string, any>,
): string {
  return compileEmail(templateName, data).subject;
}
