// Site settings for Treasure Hunt World.
window.TH_CONFIG = {
  // Where the site lives. Hunt links and QR codes are built from this.
  SITE: 'https://treasurehunt.world',

  // Your hunt engine (Cloudflare Worker) address, no trailing slash. See DEPLOY.md.
  API: 'https://treasurehunt-api.samueldhjones.workers.dev',

  // Optional, for hosts who want hunts in their own Google account (advanced). ID of the template Google Sheet (the long code in its URL between /d/ and /edit).
  // Hosts copy this sheet to get their own hunt engine. See SETUP.md, step 1.
  TEMPLATE_ID: 'PASTE_TEMPLATE_SHEET_ID_HERE',

  MAX_UPLOAD_MB: 30,
  POLL_PENDING_MS: 7000,
  POLL_IDLE_MS: 30000
};
