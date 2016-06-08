/*
 * New Condition Format plug-in
 * Copyright (c) 2016 Cybozu
 *
 * Licensed under the MIT License
 */

jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";

    var CONFIG = kintone.plugin.app.getConfig(PLUGIN_ID);

    //設定値読み込み
    if (!CONFIG) {
        return false;
    }

    //init処理で初期化される
    var TEXT_COND = [];
    var DATE_COND = [];

    var SHOW_EVENT_TARGETS = [
      // "app.record.index.show", //一覧だと列全体が書式・表示変更対象となってしまうので一旦除く
      "app.record.detail.show"
    ];
    var EDIT_EVENT_TARGETS = [
      "app.record.create.show",
      "app.record.edit.show"
    ];
    var SUBMIT_EVENT_TARGETS = [
      "app.record.index.edit.submit",
      "app.record.edit.submit",
      "app.record.create.submit"
    ];


    function changeStyle(el, color, backgroundcolor, size) {
        if (el) {
            if (color) {
                el.style.color = color;
            }
            if (backgroundcolor) {
                el.style.backgroundColor = backgroundcolor;
            }
            if (size) {
                el.style.fontSize = size;
            } else {
                el.style.fontSize = "14px";
            }
        }
    }


    //条件チェック
    function checkTextFormat(checked, value, type){
          if (!Array.isArray(checked)){
            checked = [checked];
          }
          for (var a = 0; a < checked.length; a++) {
              var ret = _checkTextFormat(checked[a], value, type);
              if(ret){
                return true;
              }
          }
          return false;
    }
    function _checkTextFormat(field, value, type) {
        var field_text = "";
        var value_text = "";

        //フィールドの値が数値のとき、数値に変換して比較。
        if (!isNaN(field)) {
            if (type === "match" || type === "unmatch") {
                field_text = field;
                value_text = value;
            } else {
                field_text = Number(field);
                value_text = Number(value);
            }
        } else {
            field_text = field;
            value_text = value;
        }

        switch (type) {
            case "match":
                if (field_text.indexOf(value_text) !== -1) {
                    return true;
                }
                break;
            case "unmatch":
                if (field_text.indexOf(value_text) === -1) {
                    return true;
                }
                break;
            case "==":
                if (field_text === value_text) {
                    return true;
                }
                break;
            case "!=":
                if (field_text !== value_text) {
                    return true;
                }
                break;
            case "<=":
                if (field_text <= value_text) {
                    return true;
                }
                break;
            case "<":
                if (field_text < value_text) {
                    return true;
                }
                break;
            case ">=":
                if (field_text >= value_text) {
                    return true;
                }
                break;
            case ">":
                if (field_text > value_text) {
                    return true;
                }
                break;
            default:
                return false;
        }
        return false;
    }
    function checkDateFormat(field, value, type) {

        if (!field) {
            return false;
        }
        var num = Number(value);//入力日数
        var field_date = moment(field).format("YYYY-MM-DD 00:00"); //対象フィールドの日付
        var value_date = moment().add(num, "days").format("YYYY-MM-DD 00:00");//条件値 = 今日の日付 + (入力日数)
        var diff = moment(field_date).diff(moment(value_date), "days");//(対象フィールドの日付-条件値）

        switch (type) {
            case "==":
                if (diff === 0) {
                    return true;
                }
                break;
            case "!=":
                if (diff !== 0) {
                    return true;
                }
                break;
            case "<=":
                if (diff <= 0) {
                    return true;
                }
                break;
            case "<":
                if (diff < 0) {
                    return true;
                }
                break;
            case ">=":
                if (diff >= 0) {
                    return true;
                }
                break;
            case ">":
                if (diff > 0) {
                    return true;
                }
                break;
            default:
                return false;
        }
        return false;
    }

    function changeStatusCode(record, string) {
        if (string !== "status") {
            return string;
        }
        var fieldcode = Object.keys(record);
        for (var n in fieldcode) {
            if (record[fieldcode[n]]["type"] === "STATUS") {
                return fieldcode[n];
            }
        }
    }

    //条件書式値取得
    function getTextFormatValues(tRow) {
        return {
            fieldText: tRow["cfield_text"]["value"],//書式条件フィールド
            typeText: tRow["ctype_text"]["value"],//条件式
            valueText: tRow["cvalue_text"]["value"],//条件値
            targetFieldText: tRow["tfield_text"]["value"],//書式編集対象フィールド
            targetColorText: tRow["tcolor_text"]["value"],//文字色
            targetBackgroundColorText: tRow["tbgcolor_text"]["value"],//背景色
            targetSizeText: tRow["tsize_text"]["value"],//サイズ
            targetRequired: tRow["trequired"]["value"],//必須
            targetDisabled: tRow["tdisabled"]["value"],//変更不可
            targetHidden: tRow["thidden"]["value"]//非表示
        };
    }
    function getDateFormatValues(dRow) {
        return {
            fieldDate: dRow["cfield_date"]["value"],//書式条件フィールド
            typeDate: dRow["ctype_date"]["value"],//条件式
            valueDate: dRow["cvalue_date"]["value"],//条件値
            targetFieldDate: dRow["tfield_date"]["value"],//書式編集対象フィールド
            targetColorDate: dRow["tcolor_date"]["value"],//文字色
            targetBackgroundColorDate: dRow["tbgcolor_date"]["value"],//背景色
            targetSizeDate: dRow["tsize_date"]["value"],//サイズ
            targetRequired: dRow["trequired"]["value"],//必須
            targetDisabled: dRow["tdisabled"]["value"],//変更不可
            targetHidden: dRow["thidden"]["value"]//非表示
        };
    }

    //初期化
    //ステータス項目（プロセス管理をする場合に存在する特殊な項目）のフィールドコードを取得するためにrecordが必要
    function init(record){
        var BODY_TEXT = JSON.parse(CONFIG["body_text"]);
        var BODY_DATE = JSON.parse(CONFIG["body_date"]);

        for(var i = 0; i < BODY_TEXT.length; i++){
            var tRow = BODY_TEXT[i];
            if (tRow["cfield_text"]["value"] !== "") {
                TEXT_COND.push(getTextFormatValues(tRow));
            }
        }
        for(var i = 0; i < BODY_DATE.length; i++){
            var dRow = BODY_DATE[i];
            if (dRow["cfield_date"]["value"] !== "") {
                DATE_COND.push(getDateFormatValues(dRow));
            }
        }

        //ステータスフィールドのフィールドコードを改めて取得し直す
        for (var st = 0; st < TEXT_COND.length; st++) {
            TEXT_COND[st].targetFieldText = changeStatusCode(record, TEXT_COND[st].targetFieldText);
            TEXT_COND[st].fieldText = changeStatusCode(record, TEXT_COND[st].fieldText);
        }
        for (var sd = 0; sd < DATE_COND.length; sd++) {
            DATE_COND[sd].targetFieldDate = changeStatusCode(record, DATE_COND[sd].targetFieldDate);
            DATE_COND[sd].fieldDATE = changeStatusCode(record, DATE_COND[sd].fieldDate);
        }
    }

    function initOnChange(){
      var TEMP_MODIFIED_EVENTS = [
        "app.record.create.change.",
        "app.record.edit.change.",
        "app.record.index.edit.change."
      ];
      function createFieldModifiedEvents(fieldcode){
        var ret = [];
        for (var i = 0; i < TEMP_MODIFIED_EVENTS.length; i++){
            ret.push(TEMP_MODIFIED_EVENTS[i] + fieldcode);
        }
        return ret;
      }
      //フィールド変更イベント
      //書式条件
      for (var i = 0; i < TEXT_COND.length; i++){
        kintone.events.on(createFieldModifiedEvents(TEXT_COND[i].fieldText), function(tcond, event){
            var record = event.record;
            var matched = checkTextFormat(record[tcond.fieldText]["value"],
              tcond.valueText, tcond.typeText);
            if(tcond.targetDisabled){
                record[tcond.targetFieldText]["disabled"] = matched;
            }
            if(tcond.targetHidden){
                kintone.app.record.setFieldShown(tcond.targetFieldText, !matched);
            }
            return event;
        }.bind(null, $.extend(true, {}, TEXT_COND[i])));
      }
      //日付型条件
      for (var i = 0; i < DATE_COND.length; i++){
        kintone.events.on(createFieldModifiedEvents(DATE_COND[i].fieldDate), function(dcond, event){
            var record = event.record;
            var matched = checkDateFormat(record[dcond.fieldDate]["value"],
              dcond.valueDate, dcond.typeDate);
            if(dcond.targetDisabled){
                record[dcond.targetFieldDate]["disabled"] = matched;
            }
            if(dcond.targetHidden){
                kintone.app.record.setFieldShown(dcond.targetFieldDate, !matched);
            }
            return event;
        }.bind(null, $.extend(true, {}, DATE_COND[i])));
      }
    }

    //レコード詳細画面 条件チェック及び書式変更
    function initOnShow(event_type, record) {
        //文字条件書式
        for (var ti = 0; ti < TEXT_COND.length; ti++) {
            var tcond = TEXT_COND[ti];
            if (!checkTextFormat(record[tcond.fieldText]["value"],
              tcond.valueText, tcond.typeText)) {
                continue;
            }
            //書式変更
            if($.inArray(event_type, SHOW_EVENT_TARGETS) != -1){
              var el_text2 = kintone.app.record.getFieldElement(tcond.targetFieldText);
              if (!el_text2) {
                  console.error("not found targetFieldText : " + tcond.targetFieldText);
                  continue;
              }
              changeStyle(el_text2, tcond.targetColorText,
                tcond.targetBackgroundColorText, tcond.targetSizeText);
            }
            //表示変更
            kintone.app.record.setFieldShown(tcond.targetFieldText, !tcond.targetHidden);
            if($.inArray(event_type, EDIT_EVENT_TARGETS) != -1){
                record[tcond.targetFieldText]["disabled"] = tcond.targetDisabled;
            }
        }
        //日付条件書式
        for (var di = 0; di < DATE_COND.length; di++) {
            var dcond = DATE_COND[di];
            if (!checkDateFormat(record[dcond.fieldDate]["value"],
              dcond.valueDate, dcond.typeDate)) {
                continue;
            }
            //書式変更
            if($.inArray(event_type, SHOW_EVENT_TARGETS) != -1){
              var el_date2 = kintone.app.record.getFieldElement(dcond.targetFieldDate);
              if (!el_date2) {
                  console.error("not found targetFieldDext : " + dcond.targetFieldDate);
                  continue;
              }
              changeStyle(el_date2, dcond.targetColorDate,
                dcond.targetBackgroundColorDate, dcond.targetSizeDate);
            }
            //表示変更
            kintone.app.record.setFieldShown(dcond.targetFieldDate, !dcond.targetHidden);
            if($.inArray(event_type, EDIT_EVENT_TARGETS) != -1){
                record[dcond.targetFieldText]["disabled"] = dcond.targetDisabled;
            }
        }

    }

    //登録時のレコードの値チェック
    ////必須入力チェック
    function validate(event){
      var record = event.record;
      var ret = true;
      //書式条件式
      for (var ti = 0; ti < TEXT_COND.length; ti++) {
          var tcond = TEXT_COND[ti];
          if (!tcond.targetRequired ||
            !checkTextFormat(record[tcond.fieldText]["value"],
            tcond.valueText, tcond.typeText)) {
              continue;
          }
          if(!record[tcond.targetFieldText]["value"]){
            record[tcond.targetFieldText].error = "必須項目です";
            ret = false;
          }
      }

      //日付条件書式
      for (var di = 0; di < DATE_COND.length; di++) {
          var dcond = DATE_COND[di];
          if (!dcond.targetRequired ||
            !checkDateFormat(record[dcond.fieldDate]["value"],
            dcond.valueDate, dcond.typeDate)) {
              continue;
          }
          if(!record[dcond.targetFieldDate]["value"]){
            record[dcond.targetFieldText].error = "必須項目です";
            ret = false;
          }
      }
      return ret;
    }
    //レコード表示イベント
    kintone.events.on(SHOW_EVENT_TARGETS, function(event) {
        init(event.record);
        initOnShow(event.type, event.record);
        return event;
    });
    //レコード編集イベント
    kintone.events.on(EDIT_EVENT_TARGETS, function(event) {
        init(event.record);
        initOnShow(event.type, event.record);
        initOnChange();
        return event;
    });
    //レコード登録イベント
    kintone.events.on(SUBMIT_EVENT_TARGETS, function(event){
        //入力不備があった場合フィールドにerrorが登録され登録処理は行われない
        validate(event);
        return event;
    });
})(jQuery, kintone.$PLUGIN_ID);
