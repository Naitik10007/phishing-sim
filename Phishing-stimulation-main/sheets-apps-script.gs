/**
 * Tech Day 2026 — Free shared storage via Google Sheets (no database server)
 *
 * SETUP:
 * 1. Create a Google Sheet with three tabs named: Leaderboard, Feedback, Progress
 * 2. In the Sheet: Extensions → Apps Script → paste this entire file → Save
 * 3. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL into js/config.js → SCRIPT_URL
 *
 * Leaderboard headers (row 1): id | name | score | quizBest | simFlags | simXp | simDone | videos | label | updatedAt
 * Feedback headers: id | name | rating | useful | clear | suggest | at
 * Progress headers: id | name | score | quizBest | simFlags | simDone | videos | engagement | updatedAt
 */

var SHEETS = {
  board: 'Leaderboard',
  feedback: 'Feedback',
  progress: 'Progress'
};

function doGet(e) {
  var action = (e.parameter && e.parameter.action) || 'leaderboard';
  if (action === 'leaderboard') {
    return json_({ ok: true, rows: readBoard_() });
  }
  if (action === 'progress') {
    return json_({ ok: true, rows: readProgress_() });
  }
  return json_({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  try {
    var raw = e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);
    var action = data.action || '';

    if (action === 'submitScore') {
      upsertBoard_(data);
      upsertProgressFromScore_(data);
      return json_({ ok: true });
    }
    if (action === 'submitFeedback') {
      appendFeedback_(data);
      return json_({ ok: true });
    }
    if (action === 'syncProgress') {
      upsertProgress_(data);
      return json_({ ok: true });
    }
    return json_({ ok: false, error: 'unknown action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  return sh;
}

function readBoard_() {
  var sh = sheet_(SHEETS.board);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) {
      row[headers[c]] = values[i][c];
    }
    if (row.id) rows.push(row);
  }
  return rows;
}

function upsertBoard_(data) {
  var sh = sheet_(SHEETS.board);
  ensureHeaders_(sh, ['id', 'name', 'score', 'quizBest', 'simFlags', 'simXp', 'simDone', 'videos', 'label', 'updatedAt']);
  var values = sh.getDataRange().getValues();
  var idCol = 0;
  var found = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(data.id)) { found = i + 1; break; }
  }
  var row = [
    data.id, data.name, Number(data.score) || 0, Number(data.quizBest) || 0,
    Number(data.simFlags) || 0, Number(data.simXp) || 0, !!data.simDone,
    Number(data.videos) || 0, data.label || '', data.updatedAt || new Date().toISOString()
  ];
  if (found > 0) {
    var existingScore = Number(values[found - 1][2]) || 0;
    if (Number(data.score) >= existingScore) sh.getRange(found, 1, 1, row.length).setValues([row]);
  } else {
    sh.appendRow(row);
  }
}

function appendFeedback_(data) {
  var sh = sheet_(SHEETS.feedback);
  ensureHeaders_(sh, ['id', 'name', 'rating', 'useful', 'clear', 'suggest', 'at']);
  sh.appendRow([
    data.id || '', data.name || '', Number(data.rating) || 0,
    data.useful || '', data.clear || '', data.suggest || '', data.at || new Date().toISOString()
  ]);
}

function upsertProgress_(data) {
  var sh = sheet_(SHEETS.progress);
  ensureHeaders_(sh, ['id', 'name', 'score', 'quizBest', 'simFlags', 'simDone', 'videos', 'engagement', 'updatedAt']);
  var values = sh.getDataRange().getValues();
  var found = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(data.id)) { found = i + 1; break; }
  }
  var eng = typeof data.engagement === 'object' ? JSON.stringify(data.engagement) : String(data.engagement || '');
  var row = [
    data.id, data.name, Number(data.score) || 0, Number(data.quizBest) || 0,
    Number(data.simFlags) || 0, !!data.simDone, Number(data.videos) || 0,
    eng, data.updatedAt || new Date().toISOString()
  ];
  if (found > 0) sh.getRange(found, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
}

function upsertProgressFromScore_(data) {
  upsertProgress_({
    id: data.id,
    name: data.name,
    score: data.score,
    quizBest: data.quizBest,
    simFlags: data.simFlags,
    simDone: data.simDone,
    videos: data.videos,
    engagement: '',
    updatedAt: data.updatedAt
  });
}

function readProgress_() {
  var sh = sheet_(SHEETS.progress);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var c = 0; c < headers.length; c++) row[headers[c]] = values[i][c];
    if (row.id) rows.push(row);
  }
  return rows;
}

function ensureHeaders_(sh, headers) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
    return;
  }
  var first = sh.getRange(1, 1, 1, headers.length).getValues()[0];
  if (!first[0]) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
}
