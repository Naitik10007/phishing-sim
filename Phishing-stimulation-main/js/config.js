/* Tech Day 2026 — configuration */
var APP_CONFIG = {

  // Shared leaderboard (Google Apps Script URL). Leave '' for local mode.
  SCRIPT_URL: '',

  // Google Form backup: stores sign-ins, scores and feedback
  GOOGLE_FORM: {
    URL: 'https://docs.google.com/forms/d/e/1FAIpQLSeQwPXZ1r4U27jkkML3PmRCD0ZEYoJM6dDNBVMNuXg2-I-Ycg/formResponse',
    FIELDS: {
      type:     'entry.1004929351',
      id:       'entry.1783285850',
      name:     'entry.1642342498',
      score:    'entry.1941241205',
      quizBest: 'entry.2069016938',
      simFlags: 'entry.1762454226',
      videos:   'entry.1593981136',
      rating:   'entry.1670660904',
      useful:   'entry.442128376',
      clear:    'entry.2102381395',
      suggest:  'entry.2131904243'
    }
  },

  // Branding
  LOGO: 'assets/logo.png',
  COMPANY_NAME: 'Your Company',

  // Videos (shown in this order on the Videos page)
  videos: [
    {
      file: 'videos/phishing_wrong_link_awareness%201.mp4',
      title: 'Wrong Links: How Phishing Tricks You',
      category: 'Phishing links',
      blurb: 'See how a look-alike link can lead you to a fake page, and how to spot it before you click.',
      points: ['Read the whole web address, not just the start', 'Watch for swapped or extra characters', 'When unsure, type the real site yourself']
    },
    {
      file: 'videos/instagram_phishing.mp4',
      title: 'Instagram Phishing: The Fake “Account Hacked” Message',
      category: 'Social media',
      blurb: 'How scammers pretend to be Instagram support and push you to a fake login page to steal your password.',
      points: ['Instagram never asks for your password in a chat', 'Be wary of countdown threats', 'Check the sender and the link before tapping']
    },
    {
      file: 'videos/qr_upi_scan.mp4',
      title: 'QR & UPI Scan Scams',
      category: 'Payments',
      blurb: 'How fake QR codes and UPI requests trick people into sending money or approving payments they did not intend.',
      points: ['You never need to scan a QR code or enter a PIN to receive money', 'Check the name shown before you pay', 'Be careful with codes stuck over other codes']
    }
  ]
};