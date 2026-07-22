/**
 * Ledger Consumer
 * Records every payment event into the payment_events table
 * for a complete, immutable audit trail.
 */

const db = require('../config/db');

async function handleLedger(event) {
  const { eventType, transactionId, senderId, receiverId, amountInCents } = event;

  // Record debit entry (sender)
  await db.query(
    `INSERT INTO payment_events (transaction_id, event_type, payload, processed_by)
     VALUES ($1, $2, $3, 'ledger-consumer')`,
    [
      transactionId,
      'ledger.debit',
      JSON.stringify({
        userId: senderId,
        type: 'debit',
        amountInCents,
        description: `Payment sent to ${receiverId}`,
      }),
    ]
  );

  // Record credit entry (receiver)
  await db.query(
    `INSERT INTO payment_events (transaction_id, event_type, payload, processed_by)
     VALUES ($1, $2, $3, 'ledger-consumer')`,
    [
      transactionId,
      'ledger.credit',
      JSON.stringify({
        userId: receiverId,
        type: 'credit',
        amountInCents,
        description: `Payment received from ${senderId}`,
      }),
    ]
  );

  console.log(`📒 Ledger: recorded debit/credit entries for tx ${transactionId}`);
}

module.exports = { handleLedger };
