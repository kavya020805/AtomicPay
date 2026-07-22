const { Kafka, logLevel } = require('kafkajs');
require('dotenv').config();

const brokers = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');

const kafka = new Kafka({
  clientId: 'atomicpay',
  brokers,
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
});

const producer = kafka.producer();
let isProducerConnected = false;

async function connectProducer() {
  if (isProducerConnected) return;
  await producer.connect();
  isProducerConnected = true;
  console.log('✅ Kafka producer connected');
}

async function disconnectProducer() {
  if (isProducerConnected) {
    await producer.disconnect();
    isProducerConnected = false;
    console.log('🔌 Kafka producer disconnected');
  }
}

/**
 * Publish an event to a Kafka topic.
 * @param {string} topic - The Kafka topic name
 * @param {string} key - Message key (used for partitioning)
 * @param {object} value - The event payload
 */
async function publishEvent(topic, key, value) {
  if (!isProducerConnected) {
    await connectProducer();
  }
  await producer.send({
    topic,
    messages: [
      {
        key,
        value: JSON.stringify({
          ...value,
          publishedAt: new Date().toISOString(),
        }),
      },
    ],
  });
}

/**
 * Create Kafka topics if they don't exist.
 * @param {Array<{topic: string, numPartitions: number}>} topics
 */
async function createTopics(topics) {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existingTopics = await admin.listTopics();
    const newTopics = topics.filter(t => !existingTopics.includes(t.topic));
    if (newTopics.length > 0) {
      await admin.createTopics({
        topics: newTopics.map(t => ({
          topic: t.topic,
          numPartitions: t.numPartitions || 3,
          replicationFactor: 1,
        })),
      });
      console.log(`✅ Kafka topics created: ${newTopics.map(t => t.topic).join(', ')}`);
    } else {
      console.log('✅ Kafka topics already exist');
    }
  } finally {
    await admin.disconnect();
  }
}

module.exports = {
  kafka,
  producer,
  connectProducer,
  disconnectProducer,
  publishEvent,
  createTopics,
};
