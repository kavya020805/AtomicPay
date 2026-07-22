const { publishEvent } = require('../config/kafka');

const TOPIC = 'payment.events';

/**
 * Publish a payment event to Kafka.
 * The event is keyed by transactionId for partition ordering.
 *
 * @param {string} eventType - e.g., 'payment.created', 'payment.completed', 'payment.failed'
 * @param {object} transaction - Transaction details
 */
async function publishPaymentEvent(eventType, transaction) {
  const event = {
    eventType,
    transactionId: transaction.id,
    senderId: transaction.sender_id,
    receiverId: transaction.receiver_id,
    amountInCents: transaction.amount_in_cents,
    status: transaction.status,
    note: transaction.note || null,
    timestamp: new Date().toISOString(),
  };

  try {
    await publishEvent(TOPIC, transaction.id, event);
    console.log(`📤 Kafka: published ${eventType} for tx ${transaction.id}`);
  } catch (err) {
    // Log but don't fail the transfer — Kafka is async and non-critical
    console.error(`❌ Kafka: failed to publish ${eventType}:`, err.message);
  }
}

module.exports = { publishPaymentEvent };
