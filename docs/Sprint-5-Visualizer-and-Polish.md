# Sprint 5: Visualizer & Polish ✨ (The Interview Wow-Factor)

## Goal
Make the app visually explain the complex backend problems it is solving. This is what sets the project apart in an interview setting.

## Tasks
- [ ] Build a "Visualizer Panel" in the frontend UI.
- [ ] When a user clicks "Send", instead of just showing a loading spinner, show a visual flow:
    - Step 1: "Acquiring Database Lock on Sender..." (Show a lock icon 🔒)
    - Step 2: "Verifying Funds..." (Show a checkmark ✅)
    - Step 3: "Deducting from Sender..."
    - Step 4: "Adding to Receiver..."
    - Step 5: "Committing Database Transaction..."
- [ ] *Optional:* Add a "Simulate Network Delay" toggle on the backend to slow down the process so the user can literally watch the lock happen and try to send another transaction at the same time to see it get queued/rejected.
- [ ] Polish the UI with modern aesthetics (glassmorphism, clean fonts, subtle animations).
- [ ] Write a final project summary in the README to help guide interview conversations.

## Definition of Done
- The app looks incredibly polished.
- An interviewer can look at the app, try to transfer money, and instantly understand that you solved the race-condition/ACID problem via the visualizer.
