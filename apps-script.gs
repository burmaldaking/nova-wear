// Google Apps Script backend for NOVA WEAR orders.
// 1. Create a new Google Sheet.
// 2. Extensions -> Apps Script. Paste this code.
// 3. Deploy -> New deployment -> Web app: Execute as "Me", Who has access "Anyone".
// 4. Copy the Web app URL and put it into script.js as ORDER_API.
// 5. In admin.js, fetchRemote() already calls ORDER_API?action=list.

const SHEET_NAME = 'Orders';

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['id','created','product','size','price','name','phone','address','comment','contactPref','messenger','callTime','status']);
  }
  return sh;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet();
    // Prefix text fields with an apostrophe so Google Sheets does not interpret
    // values like "+7 900 ..." or "=cmd" as formulas.
    const t = (v) => (v == null ? '' : "'" + String(v));
    sh.appendRow([
      data.id, data.created, t(data.product), data.size, t(data.price), t(data.name), t(data.phone),
      t(data.address || ''), t(data.comment || ''), t(data.contactPref || ''), t(data.messenger || ''),
      t(data.callTime || ''), t(data.status || 'new')
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true, id: data.id }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sh = getSheet();
  const rows = sh.getDataRange().getValues();
  if (rows.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const header = rows[0];
  const out = rows.slice(1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = r[i]; });
    // normalize types
    o.id = Number(o.id);
    return o;
  });
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}
