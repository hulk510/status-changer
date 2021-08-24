
/**
 カレンダーから今日の予定を取得し、必要であればDiscordステータスを更新する。
 https://qiita.com/zama_8722/items/7d06767b19dec745c3bf
 URLはSlackでやっているのでそれをDiscordでできるようにした。
**/
function main() {
  // カレンダーID
  const ID = "goto-eat@robes.co.jp";
  // 今日の日付
  var date = new Date();
  // カレンダーから今日の予定を取得
  var calendar = CalendarApp.getCalendarById(ID);
  var events = calendar.getEventsForDay(date);
  // 何もないときの有効期限は1時間で設定
  var default_expires_at = Utilities.formatDate(new Date(date.getHours() + 1), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss'+09:00'")

  // 今日のイベントがない場合は何もしない
  if (events.length !== 0) {
    // イベントがないときのステータス
    var set_status = {
      "custom_status": {
        "text": "なし",
        "emoji_name": "😃",
        "expires_at": default_expires_at
      }
    };

    // 今日の予定をすべて調査
    for (var i in events){
      Logger.log(events[i].getEndTime())
      // 今が予定の開始時刻以降で終了時刻以前なら今はその予定の最中 -> ステータス変更
      if (events[i].getStartTime() <= date && events[i].getEndTime() >= date) {
        set_status = createStatusText(events[i]);
        break;
      }
    }

    postSlackStatus(set_status);
  }
}

function createStatusText(event) {
  // 整形した開始時刻・終了時刻
  var start = Utilities.formatDate( event.getStartTime(), 'Asia/Tokyo', 'HH:mm');
  var end = Utilities.formatDate( event.getEndTime(), 'Asia/Tokyo', 'HH:mm');
  // ステータステキスト
  var text = `${event.getTitle()} ${start} ~ ${end}`;
  // イベントの終了時間をdiscordで表示するステータスの期限にする
  var expires_at = Utilities.formatDate(event.getEndTime(), 'Asia/Tokyo', "yyyy-MM-dd'T'HH:mm:ss'+09:00'")

  // イベントがある時のステータス
  var event_status = {
    "custom_status": {
      "text": text,
      "emoji_name": "📅",
      "expires_at": expires_at
    }
  };

  return event_status;
}

/**
 作成したステータスをDiscord web api経由でプロフィールに反映させる。
**/
function postSlackStatus(status) {
  // アクセス情報
  const TOKEN = "Your Token Here!!";
  const URL = "https://discord.com/api/v9/users/@me/settings";

  // HTTPヘッダー
  const headers = {
    "Authorization" : TOKEN,
    "Content-Type": "application/json"
  };

  //PATCHデータ
  var option = {
    "headers": headers,
    "method": "PATCH",
    "payload": JSON.stringify(status),
    "mutehttpExceptions" : true,
  };

  try {
    const res = UrlFetchApp.fetch(URL, option);
    Logger.log(res)
  } catch(e) {
    // 例外エラー処理
    Logger.log('Error:')
    Logger.log(e)
  }
}
