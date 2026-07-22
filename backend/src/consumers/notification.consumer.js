/**
 * Notification Consumer
 * Handles sending email and push notification events.
 * In production, this would integrate with SendGrid/Nodemailer/FCM.
 * For demo purposes, it logs to console.
 */

const db = require('../config/db');

async function handleNotification(event) {
  const { eventType, transactionId, senderId, receiverId, amountInCents } = event;

  // Fetch sender and receiver names
  const usersResult = await db.query(
    'SELECT id, username, email FROM users WHERE id = $1 OR id = $2',
    [senderId, receiverId]
  );

  const sender = usersResult.rows.find(u => u.id === senderId);
  const receiver = usersResult.rows.find(u => u.id === receiverId);
  const amountFormatted = `$${(amountInCents / 100).toFixed(2)}`;

  // Simulate email notifications
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 EMAIL NOTIFICATION');
  console.log(`  To: ${receiver?.email || receiverId}`);
  console.log(`  Subject: You received ${amountFormatted} from ${sender?.username || 'someone'}`);
  console.log(`  Body: ${sender?.username} sent you ${amountFormatted}.`);
  console.log(`  Transaction ID: ${transactionId}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('🔔 PUSH NOTIFICATION');
  console.log(`  To: ${sender?.username || senderId}`);
  console.log(`  Message: Your payment of ${amountFormatted} to ${receiver?.username} was successful.`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Record the event in the audit trail
  await db.query(
    `INSERT INTO payment_events (transaction_id, event_type, payload, processed_by)
     VALUES ($1, $2, $3, 'notification-consumer')`,
    [
      transactionId,
      'notification.sent',
      JSON.stringify({
        emailTo: receiver?.email,
        pushTo: sender?.username,
        amount: amountFormatted,
      }),
    ]
  );
}

module.exports = { handleNotification };
