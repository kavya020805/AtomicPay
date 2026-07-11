import React, { useMemo } from 'react';

/**
 * TransactionVisualizer
 *
 * A professional, animated visualization of an ACID database transaction.
 * Shows money traveling:  Sender ──▶ Database (lock, verify, debit, credit) ──▶ Receiver
 *
 * Props:
 *   step            0 = idle, 1 = initiated, 2 = lock acquired, 3 = debit, 4 = credit, 5 = committed
 *   senderName      display name of the sender   (falls back to "Sender")
 *   receiverName    display name of the receiver  (falls back to "Receiver")
 */
export default function Visualizer({ step, senderName = 'Sender', receiverName = 'Receiver' }) {

  // ── SQL lines that appear progressively ──
  const sqlLines = useMemo(() => [
    { minStep: 2, text: 'BEGIN;' },
    { minStep: 2, text: 'SELECT * FROM users WHERE id IN ($1,$2)' },
    { minStep: 2, text: '  FOR UPDATE;' },
    { minStep: 3, text: `UPDATE users SET balance = balance - $amt` },
    { minStep: 3, text: `  WHERE id = $sender;` },
    { minStep: 4, text: `UPDATE users SET balance = balance + $amt` },
    { minStep: 4, text: `  WHERE id = $receiver;` },
    { minStep: 5, text: 'COMMIT;' },
  ], []);

  // ── Node state helper ──
  const nodeState = (activeAt, doneAt) => {
    if (step >= doneAt) return 'done';
    if (step >= activeAt) return 'active';
    return 'idle';
  };

  const senderState   = nodeState(1, 5);
  const dbState       = nodeState(2, 5);
  const receiverState = nodeState(4, 5);

  // ── Style maps ──
  const ringColor = { idle: 'border-neutral-800', active: 'border-white', done: 'border-emerald-500' };
  const textColor = { idle: 'text-neutral-600',   active: 'text-white',   done: 'text-emerald-400'  };
  const glowStyle = {
    idle: {},
    active: { animation: 'node-glow 2s ease-in-out infinite' },
    done:   { animation: 'node-success 2s ease-in-out infinite' },
  };

  // ── Packet (traveling dot) ──
  const Packet = ({ visible, duration = '0.7s' }) => (
    <div className="absolute left-1/2 -translate-x-1/2 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      {visible && (
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 10px 3px rgba(255,255,255,0.5)',
            animation: `packet-glow-pulse 0.6s ease-in-out infinite, packet-down ${duration} ease-in-out forwards`,
          }}
        />
      )}
    </div>
  );

  return (
    <div className="h-full bg-black border border-neutral-800 rounded-lg flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-white text-lg font-semibold tracking-tight">Transaction Engine</h2>
        <p className="text-neutral-500 text-xs mt-1">Real-time visualization of PostgreSQL ACID transactions with row-level locking.</p>
      </div>

      {/* ── Animation Canvas ── */}
      <div className="flex-1 px-5 pb-2 flex flex-col items-center justify-center min-h-0">
        <div className="w-full max-w-xs flex flex-col items-center">

          {/* ━━━ SENDER NODE ━━━ */}
          <div
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${ringColor[senderState]} ${step >= 1 ? 'bg-neutral-950' : 'bg-black'}`}
            style={glowStyle[senderState]}
          >
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors duration-500 ${ringColor[senderState]} ${textColor[senderState]}`}>
              A
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate transition-colors duration-500 ${textColor[senderState]}`}>{senderName}</p>
              <p className="text-xs text-neutral-500">Sender</p>
            </div>
            {/* Status badge */}
            <div className="ml-auto shrink-0">
              {step >= 3 && step < 5 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800/50" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                  DEBITED
                </span>
              )}
              {step >= 5 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                  DONE
                </span>
              )}
            </div>
          </div>

          {/* ━━━ CONNECTION LINE 1 (Sender → DB) ━━━ */}
          <div className="relative w-px h-14 flex items-center justify-center">
            {/* Dashed line */}
            <svg width="2" height="56" className="absolute">
              <line
                x1="1" y1="0" x2="1" y2="56"
                stroke={step >= 1 ? '#525252' : '#262626'}
                strokeWidth="2"
                strokeDasharray="4 4"
                style={step >= 1 ? { animation: 'dash-flow 0.6s linear infinite' } : {}}
              />
            </svg>
            {/* Traveling packet */}
            {step === 1 && (
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'white',
                  boxShadow: '0 0 10px 3px rgba(255,255,255,0.5)',
                  top: 0,
                  animation: 'packet-glow-pulse 0.5s ease-in-out infinite, packetDown1 0.6s ease-in-out forwards',
                }}
              />
            )}
            {step >= 1 && (
              <style>{`
                @keyframes packetDown1 {
                  0%   { top: -4px; opacity: 0; }
                  15%  { opacity: 1; }
                  85%  { opacity: 1; }
                  100% { top: 52px; opacity: 0; }
                }
              `}</style>
            )}
          </div>

          {/* ━━━ DATABASE NODE ━━━ */}
          <div
            className={`w-full rounded-lg border transition-all duration-500 ${ringColor[dbState]} ${step >= 2 ? 'bg-neutral-950' : 'bg-black'}`}
            style={glowStyle[dbState]}
          >
            {/* DB Header */}
            <div className="flex items-center gap-3 p-3 border-b border-neutral-800/60">
              <div className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors duration-500 ${ringColor[dbState]} ${textColor[dbState]}`}>
                {/* Database cylinder icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium transition-colors duration-500 ${textColor[dbState]}`}>PostgreSQL</p>
                <p className="text-xs text-neutral-500">ACID Engine</p>
              </div>
              {/* Lock indicator */}
              <div className="ml-auto shrink-0">
                {step >= 2 && step < 5 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-900/30 text-red-400 border border-red-800/40" style={{ animation: 'lock-spin 0.4s ease-out' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    LOCKED
                  </span>
                )}
                {step >= 5 && (
                  <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" style={{ animation: 'success-checkmark 0.4s ease-out' }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    COMMITTED
                  </span>
                )}
              </div>
            </div>

            {/* SQL Terminal */}
            <div className="p-3">
              <div className="bg-black rounded-md border border-neutral-800/60 p-3 font-mono text-[11px] leading-relaxed min-h-[120px] overflow-hidden">
                {step < 2 ? (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <span className="text-neutral-700">$</span>
                    <span>Waiting for transaction...</span>
                    <span className="w-1.5 h-3.5 bg-neutral-700 inline-block" style={{ animation: 'cursor-blink 1s step-end infinite' }} />
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {sqlLines.map((line, i) => (
                      step >= line.minStep && (
                        <div
                          key={i}
                          className={`${line.text === 'COMMIT;' ? 'text-emerald-400' : 'text-neutral-300'}`}
                          style={{ animation: 'fade-in-up 0.3s ease-out both', animationDelay: `${(i % 3) * 80}ms` }}
                        >
                          {!line.text.startsWith('  ') && <span className="text-neutral-600 mr-1.5">{'>'}</span>}
                          {line.text.startsWith('  ') ? (
                            <span className="text-neutral-400 pl-4">{line.text.trim()}</span>
                          ) : (
                            <span>{line.text}</span>
                          )}
                        </div>
                      )
                    ))}
                    {step < 5 && (
                      <div className="flex items-center gap-1 mt-1 text-neutral-600">
                        <span className="text-neutral-700">{'>'}</span>
                        <span className="w-1.5 h-3.5 bg-neutral-500 inline-block" style={{ animation: 'cursor-blink 1s step-end infinite' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ━━━ CONNECTION LINE 2 (DB → Receiver) ━━━ */}
          <div className="relative w-px h-14 flex items-center justify-center">
            <svg width="2" height="56" className="absolute">
              <line
                x1="1" y1="0" x2="1" y2="56"
                stroke={step >= 4 ? '#525252' : '#262626'}
                strokeWidth="2"
                strokeDasharray="4 4"
                style={step >= 4 ? { animation: 'dash-flow 0.6s linear infinite' } : {}}
              />
            </svg>
            {step === 4 && (
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'white',
                  boxShadow: '0 0 10px 3px rgba(255,255,255,0.5)',
                  top: 0,
                  animation: 'packet-glow-pulse 0.5s ease-in-out infinite, packetDown2 0.6s ease-in-out forwards',
                }}
              />
            )}
            {step >= 4 && (
              <style>{`
                @keyframes packetDown2 {
                  0%   { top: -4px; opacity: 0; }
                  15%  { opacity: 1; }
                  85%  { opacity: 1; }
                  100% { top: 52px; opacity: 0; }
                }
              `}</style>
            )}
          </div>

          {/* ━━━ RECEIVER NODE ━━━ */}
          <div
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ${ringColor[receiverState]} ${textColor[receiverState]} ${step >= 4 ? 'bg-neutral-950' : 'bg-black'}`}
            style={glowStyle[receiverState]}
          >
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0 transition-colors duration-500 ${ringColor[receiverState]} ${textColor[receiverState]}`}>
              B
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate transition-colors duration-500 ${textColor[receiverState]}`}>{receiverName}</p>
              <p className="text-xs text-neutral-500">Receiver</p>
            </div>
            <div className="ml-auto shrink-0">
              {step >= 4 && step < 5 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-900/40 text-amber-400 border border-amber-800/50" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                  CREDITED
                </span>
              )}
              {step >= 5 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-800/50" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                  DONE
                </span>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className="px-5 py-2">
        <div className={`text-center text-xs font-mono py-1.5 rounded transition-all duration-500 ${
          step === 0 ? 'text-neutral-600' :
          step < 5   ? 'text-neutral-400 bg-neutral-900/50' :
                       'text-emerald-400 bg-emerald-950/30'
        }`}>
          {step === 0 && 'IDLE — Awaiting transaction'}
          {step === 1 && '⏳ Initiating transfer...'}
          {step === 2 && '🔒 Row-level lock acquired — SELECT FOR UPDATE'}
          {step === 3 && '💸 Debiting sender balance...'}
          {step === 4 && '💰 Crediting receiver balance...'}
          {step === 5 && '✓  Transaction committed successfully'}
        </div>
      </div>
    </div>
  );
}
