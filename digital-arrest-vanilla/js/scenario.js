// ===========================================================================
// FICTIONAL DEMO DATA ONLY
// ===========================================================================
// Nothing below is real. Names, numbers and IDs are randomized placeholders
// generated for this simulation and must stay that way — do not replace them
// with a real person's details, a real ID number, a real phone number, or
// real government branding.

export const FICTIONAL_VICTIM_DISPLAY_NAME = "A. Kumar";
export const FICTIONAL_CASE_NUMBER = "SIM-2026-4417";
export const FICTIONAL_ID_NUMBER = "XXXX-XXXX-6093";
export const FICTIONAL_SENDER_NUMBER = "+91 9XXXX XX217";
export const FICTIONAL_AGENCY_NAME = "Fictional Cyber Verification Cell (Simulation Only)";
export const FICTIONAL_DEMAND_AMOUNT = "₹2,00,000";
export const FICTIONAL_PAYEE = "Security Verification Account (fictional)";

export const introCopy = {
  title: "DIGITAL ARREST",
  subtitle: "Think Before You Act",
  bodyLines: [
    "You are about to step into a simulated Digital Arrest scam, from the victim's point of view.",
    "Nothing here is rushed — take your time at every step. Your decisions determine how safely you respond.",
  ],
  buttonLabel: "START SIMULATION",
  disclaimer: "Fictional scenario created for cybersecurity awareness. No real data is used.",
};

export const whatsappMessage = {
  senderName: "Unknown Contact",
  senderNumber: FICTIONAL_SENDER_NUMBER,
  accountType: "Personal Account",
  preview: "URGENT: Legal Notice",
  messages: [
    "URGENT: Legal Notice",
    "Your identity has allegedly been linked to a serious financial investigation.",
    "The official notice is attached.",
    "Please review immediately.",
  ],
  attachmentName: "ARREST_WARRANT_NOTICE.pdf",
};

export const senderInspection = {
  kind: "decision",
  id: "sender_inspection",
  prompt: "Do you notice anything suspicious about this sender?",
  options: [
    { id: "A", text: "It is a personal/unknown number" },
    { id: "B", text: "It must be legitimate because the profile looks official" },
    { id: "C", text: "I should immediately call the same number" },
    { id: "D", text: "I should send my identity documents" },
  ],
  correctOptionId: "A",
  points: 50,
  correctTitle: "GOOD EYE",
  correctExplanation:
    "Official-looking profile images do not prove authenticity. An unexpected legal threat arriving from a personal or unknown account is a major warning sign on its own.",
  incorrectTitle: "NOT THE SAFEST READ",
  incorrectExplanations: {
    B: "A profile picture or display name can be set to anything by anyone. It proves nothing about who is actually behind the account.",
    C: "That number was supplied by the suspicious message itself — calling it only connects you back to whoever sent the message, not to a real authority.",
    D: "No verification step ever requires you to send identity documents to an unknown contact.",
  },
  incorrectDefault: "That response takes the sender's claims at face value instead of questioning them.",
  saferAction: "Treat a personal/unknown number sending a legal threat as the first red flag, before you open anything.",
};

export const pdfNotice = {
  header: ["URGENT LEGAL NOTICE", "FINANCIAL INVESTIGATION"],
  subLabel: "FICTIONAL AWARENESS SIMULATION",
  issuer: FICTIONAL_AGENCY_NAME,
  caseNumber: FICTIONAL_CASE_NUMBER,
  idNumber: FICTIONAL_ID_NUMBER,
  recipientName: FICTIONAL_VICTIM_DISPLAY_NAME,
  claims: [
    "Your identity has allegedly been linked to a money laundering investigation.",
    "Your personal information was allegedly used to open an account.",
    "SECURITY / VERIFICATION PAYMENT may be required to clear your name.",
    "FAILURE TO COOPERATE MAY RESULT IN ARREST.",
    "IMMEDIATE ACTION REQUIRED.",
    "DO NOT INFORM ANYONE about this notice until the matter is resolved.",
  ],
  watermark: "FOR CYBERSECURITY TRAINING ONLY — NOT A REAL DOCUMENT",
};

export const pdfInvestigation = {
  kind: "investigation",
  id: "pdf_investigation",
  title: "Investigate the notice",
  pointsPerFlag: 50,
  flags: [
    { id: "issuer", label: "Issuing Authority", explanation: "Do not assume a document is genuine because it uses official-sounding names." },
    { id: "contact", label: "Contact Number", explanation: "Verify independently. Do not rely only on contact details provided by a suspicious message." },
    { id: "urgency", label: "IMMEDIATE ACTION REQUIRED", explanation: "Scammers create urgency to stop victims from thinking clearly." },
    { id: "arrest_threat", label: "FAILURE TO COOPERATE MAY RESULT IN ARREST", explanation: "Threats are commonly used to create panic and force a rushed decision." },
    { id: "payment", label: "SECURITY / VERIFICATION PAYMENT", explanation: "Requests for money to prove your innocence are a major warning sign." },
    { id: "secrecy", label: "DO NOT INFORM ANYONE", explanation: "Scammers isolate victims from family and friends to prevent them from getting help." },
  ],
};

export const decision1 = {
  kind: "decision",
  id: "decision_1",
  prompt: "What would you do next?",
  options: [
    { id: "A", text: "Call the number printed in the notice" },
    { id: "B", text: "Reply to the sender asking for confirmation" },
    { id: "C", text: "Verify the claim independently through an official source" },
    { id: "D", text: "Send my identity details to prove innocence" },
  ],
  correctOptionId: "C",
  points: 100,
  correctTitle: "GOOD DECISION",
  correctExplanation:
    "Do not use contact information supplied by a suspicious message to verify the message itself. Look up an official number or website independently instead.",
  incorrectTitle: "NOT THE SAFEST CHOICE",
  incorrectExplanations: {
    A: "That number came from the suspicious notice itself — calling it only reaches the scammer, not a real authority.",
    B: "Replying confirms your number is active and engaged, which scammers can use to escalate pressure. It does not verify anything.",
    D: "Sending identity details to an unverified contact hands them exactly what they need for further fraud.",
  },
  incorrectDefault: "That response moves you deeper into the scammer's script instead of stepping back to verify.",
  saferAction: "Verify independently through an official source you look up yourself — never through contact details the message gave you.",
};

export const incomingCall = {
  callerLabel: "Cyber Crime Officer",
  simulationTag: "SIMULATED CALL — FICTIONAL SCAMMER",
};

export const scammerIntroLines = [
  { speaker: "scammer", clipId: "courier_intro", mood: "professional",
    text: `Mr./Ms. ${FICTIONAL_VICTIM_DISPLAY_NAME}, your identity has been linked to a serious money laundering investigation.` },
  { speaker: "victim", clipId: "confused", mood: "confused",
    text: "I don't understand. What investigation?" },
  { speaker: "scammer", clipId: "investigation", mood: "serious",
    text: "Your identity details were allegedly used to open an account involved in financial fraud." },
  { speaker: "scammer", clipId: "digital_arrest", mood: "threatening",
    text: "You are now under digital arrest." },
  { speaker: "scammer", clipId: "do_not_disconnect", mood: "threatening",
    text: "Do not disconnect this call." },
];

export const decision2 = {
  kind: "decision",
  id: "decision_2",
  prompt: "What would you do?",
  options: [
    { id: "A", text: "Stay on the call and follow instructions" },
    { id: "B", text: "Send your identity documents to prove innocence" },
    { id: "C", text: "End the call and independently verify the claim" },
    { id: "D", text: "Transfer money to prove innocence" },
  ],
  correctOptionId: "C",
  points: 150,
  correctTitle: "GOOD DECISION",
  correctExplanation:
    "Real authorities do not require you to remain on a video call under a so-called \"digital arrest,\" and they do not ask for money to prove your innocence.",
  incorrectTitle: "NOT THE SAFEST CHOICE",
  incorrectExplanations: {
    A: "Staying on the call keeps you inside the scammer's pressure environment, where panic — not facts — drives your next decisions.",
    B: "Sending identity documents hands the scammer exactly what they need for further fraud. No real verification requires this over an unsolicited call.",
    D: "No real legal process is resolved by transferring money on the spot during a phone call. This is the scam's actual goal.",
  },
  incorrectDefault: "This keeps you inside the scam instead of stepping outside it to verify independently.",
  saferAction: "End the call and verify independently through an official number or website you look up yourself.",
};

export const pressureLines = [
  { speaker: "scammer", clipId: "isolation_warrant", mood: "threatening", text: "If you disconnect, a warrant will be executed immediately." },
  { speaker: "scammer", clipId: "isolation_family", mood: "threatening", text: "You are not allowed to contact your family." },
  { speaker: "scammer", clipId: "isolation_camera", mood: "manipulative", text: "Keep your camera on." },
  { speaker: "scammer", clipId: "isolation_cooperate", mood: "manipulative", text: "You must cooperate." },
];

export const moneyDemandLines = [
  { speaker: "scammer", clipId: "money_demand", mood: "manipulative", text: "To prove that you are not involved, you must transfer a security amount." },
  { speaker: "scammer", clipId: "money_return", mood: "manipulative", text: "The money will be returned after the investigation." },
  { speaker: "scammer", clipId: "money_now", mood: "threatening", text: "Do it immediately." },
];

export const moneyDemand = {
  amount: FICTIONAL_DEMAND_AMOUNT,
  payee: FICTIONAL_PAYEE,
};

export const decision3 = {
  kind: "decision",
  id: "decision_3",
  prompt: "What should you do?",
  options: [
    { id: "A", text: "Transfer the money" },
    { id: "B", text: "Share your OTP" },
    { id: "C", text: "End the call and verify independently" },
    { id: "D", text: "Share your UPI PIN" },
  ],
  correctOptionId: "C",
  points: 150,
  correctTitle: "CORRECT — THIS BREAKS THE SCAM'S CONTROL",
  correctExplanation:
    "Never transfer money, share OTPs, passwords, UPI PINs or banking credentials because someone threatens you with arrest. Ending the call and verifying independently is always safe.",
  incorrectTitle: "STOP — THIS IS A SCAM WARNING SIGN",
  incorrectExplanations: {
    A: "No legitimate agency collects a \"security amount\" by pressuring you into an instant transfer during a call.",
    B: "An OTP authorizes a transaction. Sharing it hands control of your account directly to the scammer.",
    D: "A UPI PIN authorizes payments. No real investigation ever needs it — sharing it enables direct theft.",
  },
  incorrectDefault: "Never transfer money, share OTPs, passwords, UPI PINs or banking credentials under threat.",
  saferAction: "End the call and verify independently before taking any financial action.",
};

export const revealLines = [
  { speaker: "narrator", clipId: "reveal_stop", mood: "neutral", text: "STOP." },
  { speaker: "narrator", clipId: "reveal_manipulated", mood: "neutral", text: "YOU WERE BEING MANIPULATED." },
  { speaker: "narrator", clipId: "reveal_scam", mood: "neutral", text: "DIGITAL ARREST IS A SCAM." },
  { speaker: "narrator", clipId: "reveal_no_such_process", mood: "neutral", text: "There is no legal process called \"Digital Arrest.\"" },
  { speaker: "narrator", clipId: "reveal_no_requirement", mood: "neutral", text: "No legitimate investigation requires you to stay on a video call or transfer money to prove your innocence." },
];

export const decisionFinal = {
  kind: "decision",
  id: "decision_final",
  prompt: "You realize this may be a scam. What should you do now?",
  options: [
    { id: "A", text: "Continue talking to the caller" },
    { id: "B", text: "Pay the requested amount" },
    { id: "C", text: "End the call, verify independently, tell someone you trust, and report it" },
    { id: "D", text: "Send additional personal information" },
  ],
  correctOptionId: "C",
  points: 250,
  correctTitle: "EXCELLENT — THIS IS THE SAFE PATH",
  correctExplanation:
    "Ending the call, verifying independently, telling someone you trust, and reporting the incident protects you and helps stop the scam from reaching others.",
  incorrectTitle: "NOT THE SAFEST CHOICE",
  incorrectExplanations: {
    A: "Continuing the conversation keeps you inside a manipulation designed to wear down your judgment.",
    B: "Paying confirms to the scammer that pressure tactics work, and the money is virtually unrecoverable once sent.",
    D: "Sending more personal information hands the scammer further tools for fraud against you.",
  },
  incorrectDefault: "Only stopping contact, verifying independently and reporting it actually ends the scam.",
  saferAction: "Disconnect. Verify. Talk to someone you trust. Report it.",
};

export const finalActionSteps = ["DISCONNECT", "VERIFY", "TALK", "REPORT"];

export const redFlagSummary = [
  "Unknown/personal sender",
  "Fake authority",
  "Threat of arrest",
  "Urgency",
  "Forced video call",
  "Isolation",
  "Secrecy",
  "Money demand",
  "OTP/password/UPI PIN request",
  "Fake documents",
];

export const rememberWords = ["STOP", "THINK", "VERIFY", "REPORT"];

export const reportingInfo = {
  helpline: "Call 1930 — National Cyber Crime Helpline",
  portal: "Visit cybercrime.gov.in — National Cyber Crime Reporting Portal",
  talk: "Talk to someone you trust.",
  noShare: "Do not share OTPs, passwords, UPI PINs or banking credentials.",
};

export function scoreCategory(score, maxScore) {
  const pct = (score / maxScore) * 1000;
  if (pct >= 850) return "CYBER SMART";
  if (pct >= 600) return "GOOD AWARENESS";
  if (pct >= 300) return "STAY ALERT";
  return "LEARN THE RED FLAGS";
}

export const MAX_SCORE =
  senderInspection.points +
  pdfInvestigation.flags.length * pdfInvestigation.pointsPerFlag +
  decision1.points +
  decision2.points +
  decision3.points +
  decisionFinal.points;

export const TOTAL_DECISIONS = 5; // sender_inspection, decision_1, decision_2, decision_3, decision_final
export const TOTAL_RED_FLAGS = pdfInvestigation.flags.length;
