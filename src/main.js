/**
 * リマインダーBOT
 */
const LINE_NOTIFY_TOKEN = '*****'; // LINE NOTIFYのアクセストークン
const SSID_REMAINDER = '*****'; // リマインダーのスプレッドシートのID
const SSN_REMAINDER = 'line_trigger'; // リマインダーのスプレッドシートのシート名
const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

let spreadsheet = SpreadsheetApp.openById(SSID_REMAINDER);
let sheet = spreadsheet.getSheetByName(SSN_REMAINDER);

/**
 * メイン処理
 */
function main() {
    try {
        deleteTrigger();
        let nowDt = new Date();

        let itemList = getItemList();
        for (let i in itemList) {
            let item = itemList[i];

            if (item.type == `毎週${WEEKDAY[nowDt.getDay()]}` ||
                item.type == '毎日') {

                let trigger = setTrigger(item.time);
                sheet.getRange(parseInt(i) + 1, 4).setValue(trigger.getUniqueId());
            }
        }
    } catch (e) {
        console.error(e.stack);
    }
}

/**
 * メッセージを通知する
 * @param {Object} e
 */
function notify(e) {
    try {
        console.log(`notify: triggerUid=${e.triggerUid}`);

        let itemList = getItemList();
        for (let i in itemList) {
            let item = itemList[i];
            if (item.triggerId == e.triggerUid) {
                sendLineNotify(`\n${item.message}`);
            }
        }
    } catch (e) {
        console.error(e.stack);
    }
}

/**
 * トリガーを設定する
 * @param {String} time 
 * @return trigger
 */
function setTrigger(time) {
    let arr = time.split(':');
    var date = new Date();
    date.setHours(arr[0]);
    date.setMinutes(arr[1]);
    return ScriptApp.newTrigger('notify')
        .timeBased()
        .at(date)
        .create();
}

/**
 * トリガーを削除する
 */
function deleteTrigger() {
    let triggerList = ScriptApp.getProjectTriggers();
    for (let i in triggerList) {
        let trigger = triggerList[i];
        if (trigger.getHandlerFunction() == 'notify') {
            ScriptApp.deleteTrigger(trigger);
        }
    }
}

/**
 * スプレッドシートのデータを取得する
 * @return itemList
 */
function getItemList() {
    let itemList = [];
    let lastRow = sheet.getLastRow();
    if (0 < lastRow) {
        itemList = sheet.getRange(1, 1, lastRow, 4).getValues();
        itemList = itemList.map((row) => {
            return {
                type: row[0],
                time: row[1],
                message: row[2],
                triggerId: row[3],
            }
        });
    }
    return itemList;
}

/**
 * LINEにメッセージを送信する
 * @param {String} message メッセージ 
 */
function sendLineNotify(message) {
    let url = 'https://notify-api.line.me/api/notify';
    let options = {
        'method': 'post',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Authorization': `Bearer ${LINE_NOTIFY_TOKEN}`
        },
        'payload': `message=${message}`
    };
    let response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText('UTF-8'));
}