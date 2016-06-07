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

    var BODY_TEXT = JSON.parse(CONFIG["body_text"]);
    var BODY_DATE = JSON.parse(CONFIG["body_date"]);

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

    function changeDisplay(el, disabled, hidden) {
        if (el) {
            $(el).prop("disabled", disabled);
            hidden ? $(el).hide() : $(el).show();
        }
    }

    //条件チェック
    function checkTextFormat(field, value, type) {
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
            targetRequired: tRow["trequired"]["value"],//必須
            targetDisabled: tRow["tdisabled"]["value"],//変更不可
            targetHidden: tRow["thidden"]["value"]//非表示
        };
    }

    //レコード一覧画面 条件チェック及び書式変更
    function setIndexFormat(event) {
        var record = [];
        var t = [];
        var d = [];

        for(var i = 0; i < BODY_TEXT.length; i++){
            var tRow = BODY_TEXT[i];
            if (tRow["cfield_text"]["value"] !== "") {
                t.push(getTextFormatValues(tRow));
            }
        }
        for(var i = 0; i < BODY_DATE.length; i++){
            var dRow = BODY_DATE[i];
            if (dRow["cfield_date"]["value"] !== "") {
                d.push(getDateFormatValues(dRow));
            }
        }

        //ステータスフィールドのフィールドコードを改めて取得し直す
        for (var st = 0; st < t.length; st++) {
            t[st].targetFieldText = changeStatusCode(event.records[0], t[st].targetFieldText);
            t[st].fieldText = changeStatusCode(event.records[0], t[st].fieldText);
        }
        for (var sd = 0; sd < d.length; sd++) {
            d[sd].targetFieldDate = changeStatusCode(event.records[0], d[sd].targetFieldDate);
        }

        //文字条件書式
        for (var ti2 = 0; ti2 < t.length; ti2++) {
            //各行のターゲットフィールドの要素を取得する
            var el_text2 = kintone.app.getFieldElements(t[ti2].targetFieldText);
            if (!el_text2) {
                console.error("not found targetFieldText : " + t[ti2].targetFieldText);
                continue;
            }
            for (var tn = 0; tn < el_text2.length; tn++) {
                record = event.records[tn];
                var text2_value = record[t[ti2].fieldText]["value"];
                //チェックボックス、複数選択の判別
                if (Array.isArray(text2_value)) {
                    for (var a = 0; a < text2_value.length; a++) {
                        if (checkTextFormat(text2_value[a], t[ti2].valueText, t[ti2].typeText)) {
                            //書式変更
                            changeStyle(el_text2[tn], t[ti2].targetColorText,
                            t[ti2].targetBackgroundColorText, t[ti2].targetSizeText);
                            changeDisplay(el_text2[tn], t[ti2].targetDisabled, t[ti2].targetHidden);
                            break;
                        }
                    }
                } else if (checkTextFormat(text2_value, t[ti2].valueText, t[ti2].typeText)) {
                    //書式変更
                    changeStyle(el_text2[tn], t[ti2].targetColorText,
                    t[ti2].targetBackgroundColorText, t[ti2].targetSizeText);
                    changeDisplay(el_text2[tn], t[ti2].targetDisabled, t[ti2].targetHidden);

                }
            }
        }

        //日付条件書式
        for (var di2 = 0; di2 < d.length; di2++) {
            //各行のターゲットフィールドの要素を取得する
            var el_date2 = kintone.app.getFieldElements(d[di2].targetFieldDate);
            if (!el_date2) {
                continue;
            }
            for (var dn = 0; dn < el_date2.length; dn++) {
                record = event.records[dn];
                if (checkDateFormat(record[d[di2].fieldDate]["value"],
                    d[di2].valueDate, d[di2].typeDate)) {
                    //書式変更
                    changeStyle(el_date2[dn], d[di2].targetColorDate,
                    d[di2].targetBackgroundColorDate, d[di2].targetSizeDate);
                    changeDisplay(el_date2[dn], d[di2].targetDisabled, d[di2].targetHidden);
                }
            }
        }
    }
    //レコード詳細画面 条件チェック及び書式変更
    function setDetailFormat(event) {
        var record = event.record;
        var t = [];
        var d = [];

        for(var i = 0; i < BODY_TEXT.length; i++){
            var tRow = BODY_TEXT[i];
            if (tRow["cfield_text"]["value"] !== "") {
                t.push(getTextFormatValues(tRow));
            }
        }
        for(var i = 0; i < BODY_DATE.length; i++){
            var dRow = BODY_DATE[i];
            if (dRow["cfield_date"]["value"] !== "") {
                d.push(getDateFormatValues(dRow));
            }
        }

        //ステータスフィールドのフィールドコードを改めて取得し直す
        for (var st = 0; st < t.length; st++) {
            t[st].targetFieldText = changeStatusCode(event.record, t[st].targetFieldText);
            t[st].fieldText = changeStatusCode(event.record, t[st].fieldText);
        }
        for (var sd = 0; sd < d.length; sd++) {
            d[sd].targetFieldDate = changeStatusCode(event.record, d[sd].targetFieldDate);
        }

        //文字条件書式
        for (var ti = 0; ti < t.length; ti++) {
            var el_text = kintone.app.record.getFieldElement(t[ti].targetFieldText);
            if (!el_text) {
                continue;
            }
            var text_value = record[t[ti].fieldText]["value"];
            if (Array.isArray(text_value)) {
                for (var a = 0; a < text_value.length; a++) {
                    if (checkTextFormat(text_value[a], t[ti].valueText, t[ti].typeText)) {
                        //書式変更
                        changeStyle(el_text, t[ti].targetColorText,
                        t[ti].targetBackgroundColorText, t[ti].targetSizeText);
                        changeDisplay(el_text, t[ti].targetDisabled, t[ti].targetHidden);
                        break;
                    }
                }
            } else if (checkTextFormat(text_value, t[ti].valueText, t[ti].typeText)) {
                //書式変更
                changeStyle(el_text, t[ti].targetColorText, t[ti].targetBackgroundColorText, t[ti].targetSizeText);
                changeDisplay(el_text, t[ti].targetDisabled, t[ti].targetHidden);
            }
        }

        //日付条件書式
        for (var di = 0; di < d.length; di++) {
            if (checkDateFormat(record[d[di].fieldDate]["value"], d[di].valueDate, d[di].typeDate)) {
                //書式変更
                var el_date = kintone.app.record.getFieldElement(d[di].targetFieldDate);
                if (!el_date) {
                    continue;
                }
                changeStyle(el_date, d[di].targetColorDate, d[di].targetBackgroundColorDate, d[di].targetSizeDate);
                changeDisplay(el_date, d[di].targetDisabled, d[di].targetHidden);
            }
        }
    }

    //レコード一覧表示イベント
    kintone.events.on("app.record.index.show", function(event) {
        setIndexFormat(event);
        return event;
    });
    //レコード詳細表示イベント
    kintone.events.on("app.record.detail.show", function(event) {
        setDetailFormat(event);
        return event;
    });
})(jQuery, kintone.$PLUGIN_ID);
