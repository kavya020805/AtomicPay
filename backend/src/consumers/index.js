/**
 * Kafka Consumer Orchestrator
 * Manages all Kafka consumers in a single consumer group.
 * Each message is processed by ALL consumers (notification, ledger, fraud, analytics).
 */

const { kafka } = require('../config/kafka');
const { handleNotification } = require('./notification.consumer');
const { handleLedger } = require('./ledger.consumer');
const { handleFraud } = require('./fraud.consumer');
const { handleAnalytics } = require('./analytics.consumer');

const TOPIC = 'payment.events';
const GROUP_ID = 'atomicpay-payment-processors';

let consumer;

async function startConsumers() {
  consumer = kafka.consumer({ groupId: GROUP_ID });

  await consumer.connect();
  console.log('✅ Kafka consumer group connected');

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const event = JSON.parse(message.value.toString());
      const key = message.key?.toString() || 'unknown';

      console.log(`\n📨 Kafka: received ${event.eventType} (partition: ${partition}, key: ${key})`);

      // Process through all consumer handlers
      const consumers = [
        { name: 'Notification', handler: handleNotification },
        { name: 'Ledger', handler: handleLedger },
        { name: 'Fraud', handler: handleFraud },
        { name: 'Analytics', handler: handleAnalytics },
      ];

      for (const { name, handler } of consumers) {
        try {
          await handler(event);
        } catch (err) {
          console.error(`❌ ${name} consumer error for tx ${event.transactionId}:`, err.message);
          // Don't re-throw — other consumers should still process
        }
      }

      console.log(`✅ All consumers processed tx ${event.transactionId}\n`);
    },
  });

  console.log(`🎧 Kafka: listening on topic "${TOPIC}"`);
}

async function stopConsumers() {
  if (consumer) {
    await consumer.disconnect();
    console.log('🔌 Kafka consumers disconnected');
  }
}

module.exports = { startConsumers, stopConsumers };
