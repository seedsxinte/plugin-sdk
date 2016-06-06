/*
 * extend Condition Format plug-in
 * Copyright (c) 2016 Cybozu
 *
 * Licensed under the MIT License
 */

jQuery.noConflict();

(function($, PLUGIN_ID) {
    "use strict";

    // 秘密鍵の設定
    var CONF = kintone.plugin.app.getConfig(PLUGIN_ID);

    $(function() {
        // ツールチップ機能を適用
        $(".conditionformat-plugin-tooltip").tooltip();
    });

    function escapeHtml(htmlstr) {
        return htmlstr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function setDefault() {
        //既に値が設定されている場合はフィールドに値を設定する
        if (CONF["body_text"]) {
            var body_text = JSON.parse(CONF["body_text"]);
            var body_date = JSON.parse(CONF["body_date"]);

            var tRows = getTextRows();
            for (var i = 0; i < tRows.length; i++) {
                var c = body_text[i];
                var $row = $(tRows[i]);
                $row.find(".conditionformat-cfield_text").val(c["cfield_text"]["value"]);
                $row.find(".conditionformat-ctype_text").val(c["ctype_text"]["value"]);
                $row.find(".conditionformat-cvalue_text").val(c["cvalue_text"]["value"]);
                $row.find(".conditionformat-tfield_text").val(c["tfield_text"]["value"]);
                $row.find(".conditionformat-tcolor_text").val(c["tcolor_text"]["value"]);
                $row.find(".conditionformat-tbgcolor_text").val(c["tbgcolor_text"]["value"]);
                $row.find(".conditionformat-tsize_text").val(c["tsize_text"]["value"]);
                $row.find(".conditionformat-tcolor_text")[0].
                  setAttribute("style", "color:" + c["tcolor_text"]["value"]);
                $row.find(".conditionformat-tbgcolor_text")[0].
                  setAttribute("style", "color:" + c["tbgcolor_text"]["value"]);
            }
            var dRows = getDateRows();
            for (var i = 0; i < dRows.length; i++) {
                var c = body_date[i];
                var $row = $(dRows[i]);
                $row.find(".conditionformat-cfield_date").val(c["cfield_date"]["value"]);
                $row.find(".conditionformat-ctype_date").val(c["ctype_date"]["value"]);
                $row.find(".conditionformat-cvalue_date").val(c["cvalue_date"]["value"]);
                $row.find(".conditionformat-tfield_date").val(c["tfield_date"]["value"]);
                $row.find(".conditionformat-tcolor_date").val(c["tcolor_date"]["value"]);
                $row.find(".conditionformat-tbgcolor_date").val(c["tbgcolor_date"]["value"]);
                $row.find(".conditionformat-tsize_date").val(c["tsize_date"]["value"]);
                $row.find(".conditionformat-tcolor_date")[0].
                  setAttribute("style", "color:" + c["tcolor_date"]["value"]);
                $row.find(".conditionformat-tbgcolor_date")[0].
                  setAttribute("style", "color:" + c["tbgcolor_date"]["value"]);
            }
        }
    }

    function setDropdown() {
        // フォーム設計情報を取得し、選択ボックスに代入する
        kintone.api(kintone.api.url("/k/v1/preview/form", true), "GET", {"app": kintone.app.getId()}, function(resp) {
            var $option_status = $("<option>");
            $option_status.attr("value", "status");
            $option_status.text("ステータス");
            $(".conditionformat-cfield_text").append($option_status.clone());
            $(".conditionformat-tfield_text").append($option_status.clone());
            $(".conditionformat-tfield_date").append($option_status.clone());

            for (var i = 0; i < resp.properties.length; i++) {
                var prop = resp.properties[i];
                var $option = $("<option>");

                switch (prop.type) {
                    case "SINGLE_LINE_TEXT":
                    case "NUMBER":
                    case "CALC":
                    case "RADIO_BUTTON":
                    case "DROP_DOWN":
                    case "RECORD_NUMBER":
                    case "MULTI_LINE_TEXT":
                    case "CHECK_BOX":
                    case "MULTI_SELECT":

                        $option.attr("value", escapeHtml(prop.code));
                        $option.text(escapeHtml(prop.label));
                        $(".conditionformat-cfield_text").append($option.clone());
                        $(".conditionformat-tfield_text").append($option.clone());
                        $(".conditionformat-tfield_date").append($option.clone());
                        break;

                    case "DATE":
                    case "DATETIME":
                    case "CREATED_TIME":
                    case "UPDATED_TIME":

                        $option.attr("value", escapeHtml(prop.code));
                        $option.text(escapeHtml(prop.label));
                        $(".conditionformat-tfield_text").append($option.clone());
                        $(".conditionformat-cfield_date").append($option.clone());
                        $(".conditionformat-tfield_date").append($option.clone());
                        break;

                    default :
                        break;
                }
            }
            //APIで値を取得した後、
            setDefault();
        });
    }

    function initRows() {
        //すでに設定されている行を用意する
        var firstTextRow = $("#conditionformat-plugin-text-table-code tbody tr:first")[0];
        var firstDateRow = $("#conditionformat-plugin-date-table-code tbody tr:first")[0];
        if (CONF["body_text"]) {
            var body_text = JSON.parse(CONF["body_text"]);
            for (var i = 1; i < body_text.length; i++) {
              copyRow($(firstTextRow));
            }
        }
        if (CONF["body_date"]) {
            var body_date = JSON.parse(CONF["body_date"]);
            for (var i = 1; i < body_date.length; i++) {
              copyRow($(firstDateRow));
            }
        }
        setDropdown();
    }
    
    function copyRow($tr){
      var $copied = $tr.clone(true,true);
      //select値もコピー
      var orig = $tr.find("select");
      var dest = $copied.find("select");
      for ( var i = 0; i < orig.length; i++){
        $(dest[i]).val($(orig[i]).val());
      }
      $tr.after($copied);
      sort();
      return $copied;
    }

    function removeRow($tr){
      //自分以外にtrがない場合は、行は消さずに値だけ初期化
      if($tr.siblings("tr").length == 0){
        clearFields($tr);
        return;
      }
      $tr.remove();
      sort();
    }

    function clearFields($tr){
      $tr.find("select").val("");
      $tr.find(".conditionformat-cvalue").val("");
      $tr.find(".conditionformat-cvalue-date").val("0");
      $tr.find(".conditionformat-color").val("#000000");
      $tr.find(".conditionformat-color")[0].setAttribute("style", "color:" + "#000000");
      $tr.find(".conditionformat-backgroundcolor").val("#");
      $tr.find(".conditionformat-backgroundcolor")[0].setAttribute("style", "color:" + "#");
    }

    function getTextRows(){
      return $("#conditionformat-plugin-text-table-code tbody tr");
    }
    function getDateRows(){
      return $("#conditionformat-plugin-date-table-code tbody tr");
    }

    function sort(){
        getTextRows().each(function(i, e){
            $(e).find(".conditionformat-text-no").html(i+1);
        });
        getDateRows().each(function(i, e){
            $(e).find(".conditionformat-date-no").html(i+1);
        });
    }

    function saveConfig(vals) {
        var body_text = [];
        for (var si = 0; si < vals.texts.length; si++) {
            var t = vals.texts[si];

            body_text.push({
              "cfield_text" : {"value": t.fieldText},
              "ctype_text" : {"value": t.typeText},
              "cvalue_text" : {"value": t.valueText},
              "tfield_text" : {"value": t.targetFieldText},
              "tcolor_text" : {"value": t.targetColorText},
              "tbgcolor_text" : {"value": t.targetBackgroundColorText},
              "tsize_text" : {"value": t.targetSizeText}
            });
        }
        var body_date = [];
        for (var si = 0; si < vals.dates.length; si++) {
            var d = vals.dates[si];

            body_date.push({
              "cfield_date" : {"value": d.fieldDate},
              "ctype_date" : {"value": d.typeDate},
              "cvalue_date" : {"value": d.valueDate},
              "tfield_date" : {"value": d.targetFieldDate},
              "tcolor_date" : {"value": d.targetColorDate},
              "tbgcolor_date" : {"value": d.targetBackgroundColorDate},
              "tsize_date" : {"value": d.targetSizeDate}
            });
        }
        var config = [];
        config["body_text"] = JSON.stringify(body_text);
        config["body_date"] = JSON.stringify(body_date);

        kintone.plugin.app.setConfig(config);
    }

    function checkValues(vals) {
        //文字書式入力チェック
        for (var ci = 0; ci < vals.texts.length; ci++) {
            var t = vals.texts[ci];

            //文字条件書式必須入力項目チェック
            if ((t.fieldText === "" || t.typeText === "" || t.valueText === "" || t.targetFieldText === "") &&
                !(t.fieldText === "" && t.typeText === "" && t.valueText === "" && t.targetFieldText === "")) {
                alert("文字条件書式の" + (ci + 1) + "行目の必須入力項目を\n入力してください");
                return false;
            }

            //HTML特殊文字(&, <, >, ", ')が含まれるときエラー
            if (t.valueText.match(/\&|<|\>|\"|\'/g) !== null || t.targetColorText.match(/\&|<|\>|\"|\'/g) !== null ||
                t.targetBackgroundColorText.match(/\&|<|\>|\"|\'/g) !== null) {
                alert("条件値または色にHTML特殊文字(&, <, >, \", \')を\n入力することはできません");
                return false;
            }

            //文字条件書式の文字色のはじめの文字が#でなければエラー
            if (t.targetColorText.slice(0, 1) !== "#") {
                alert("文字条件書式の" + (ci + 1) + "行目の文字色には\n「#000000-#FFFFFF」を入力してください");
                return false;
            }

            //文字条件書式の文字色に#000000-#FFFFFF以外が入力されているときエラー
            if (t.targetColorText.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
                if (t.targetColorText !== "#000000") {
                    alert("文字条件書式の" + (ci + 1) + "行目の文字色には\nカラーコード「#000000-#FFFFFF」を入力してください");
                    return false;
                }
            }

            //文字条件書式の背景色のはじめの文字が#でなければエラー
            if (t.targetBackgroundColorText.slice(0, 1) !== "#") {
                alert("文字条件書式の" + (ci + 1) + "行目の背景色には\n「#000000-#FFFFFF」を入力してください");
                return false;
            }

            //文字条件書式の背景色に#000000-#FFFFFF以外が入力されているときエラー
            if (t.targetBackgroundColorText.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
                if (t.targetBackgroundColorText !== "#") {
                    alert("文字条件書式の" + (ci + 1) + "行目の背景色には\nカラーコード「#000000-#FFFFFF」を入力してください");
                    return false;
                }
            }
        }
        //日付条件入力チェック
        for (var ci = 0; ci < vals.dates.length; ci++) {
            var d = vals.dates[ci];

            //日付条件書式必須入力項目チェック
            if ((d.fieldDate === "" || d.typeDate === "" || d.targetFieldDate === "") &&
                !(d.fieldDate === "" && d.typeDate === "" && d.targetFieldDate === "")) {
                alert("日付条件書式の" + (ci + 1) + "行目の必須入力項目を\n入力してください");
                return false;
            }

            //HTML特殊文字(&, <, >, ", ')が含まれるときエラー
            if (d.valueDate.match(/\&|<|\>|\"|\'/g) !== null || d.targetColorDate.match(/\&|<|\>|\"|\'/g) !== null ||
                d.targetBackgroundColorDate.match(/\&|<|\>|\"|\'/g) !== null) {
                alert("条件値または色にHTML特殊文字(&, <, >, \", \')を\n入力することはできません");
                return false;
            }

            //日付条件書式の条件値に数値とマイナス以外が入力されているときエラー
            if (isNaN(d.valueDate)) {
                alert("日付条件書式の" + (ci + 1) + "行目の条件値には\n半角数字もしくは - (マイナス)を入力してください");
                return false;
            }

            //日付条件書式の条件値に.(小数点)を入力されているときエラー
            if (d.valueDate.indexOf(".") > -1) {
                alert("日付条件書式の" + (ci + 1) + "行目の条件値には\n整数を入力してください");
                return false;
            }

            //日付条件書式の文字色のはじめの文字が#でなければエラー
            if (d.targetColorDate.slice(0, 1) !== "#") {
                alert("日付条件書式の" + (ci + 1) + "行目の文字色には\n「#000000-#FFFFFF」を入力してください");
                return false;
            }

            //日付条件書式の文字色に#000000-#FFFFFF以外が入力されているときエラー
            if (d.targetColorDate.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
                if (d.targetColorDate !== "#000000") {
                    alert("日付条件書式の" + (ci + 1) + "行目の文字色には\nカラーコード「#000000-#FFFFFF」を入力してください");
                    return false;
                }
            }

            //日付条件書式の背景色のはじめの文字が#でなければエラー
            if (d.targetBackgroundColorDate.slice(0, 1) !== "#") {
                alert("日付条件書式の" + (ci + 1) + "行目の背景色には\n「#000000-#FFFFFF」を入力してください");
                return false;
            }

            //日付条件書式の背景色に#000000-#FFFFFF以外が入力されているときエラー
            if (d.targetBackgroundColorDate.slice(1, 7).match(/[0-9A-Fa-f]{6}/) === null) {
                if (d.targetBackgroundColorDate !== "#") {
                    alert("日付条件書式の" + (ci + 1) + "行目の背景色には\nカラーコード「#000000-#FFFFFF」を入力してください");
                    return false;
                }
            }
        }
        return true;
    }

    //入力した値を取得。
    function getValues() {
        var vals = {
          texts : [],
          dates : []
        };
        sort();
        getTextRows().each(function(i, e){
            var $el = $(e);
            vals.texts.push({
                  textNo: i+1,
                  fieldText: $el.find(".conditionformat-cfield_text").val(),
                  typeText: $el.find(".conditionformat-ctype_text").val(),
                  valueText: $el.find(".conditionformat-cvalue_text").val(),
                  targetFieldText: $el.find(".conditionformat-tfield_text").val(),
                  targetColorText: $el.find(".conditionformat-tcolor_text").val(),
                  targetBackgroundColorText: $el.find(".conditionformat-tbgcolor_text").val(),
                  targetSizeText: $el.find(".conditionformat-tsize_text").val()
            });
        });
        getDateRows().each(function(i, e){
            var $el = $(e);
            vals.dates.push({
                  dateNo: i+1,
                  fieldDate: $el.find(".conditionformat-cfield_date").val(),
                  typeDate: $el.find(".conditionformat-ctype_date").val(),
                  valueDate: $el.find(".conditionformat-cvalue_date").val(),
                  targetFieldDate: $el.find(".conditionformat-tfield_date").val(),
                  targetColorDate: $el.find(".conditionformat-tcolor_date").val(),
                  targetBackgroundColorDate: $el.find(".conditionformat-tbgcolor_date").val(),
                  targetSizeDate: $el.find(".conditionformat-tsize_date").val()
            });
        });
        return vals;
    }

    //文字色のカラーコードが変更された際に文字色変更。
    $(".conditionformat-color").change(function() {
        var $tr = $($(this).parents("tr")[0]);
        $tr.find(".conditionformat-color");
        $tr.find(".conditionformat-color")[0].setAttribute("style", "color:" + $(this).val());
        return true;
    });

    //背景色のカラーコードが変更された際に文字色変更。
    $(".conditionformat-backgroundcolor").change(function() {
        var $tr = $($(this).parents("tr")[0]);
        $tr.find(".conditionformat-backgroundcolor");
        $tr.find(".conditionformat-backgroundcolor")[0].setAttribute("style", "color:" + $(this).val());
        return true;
    });


    //クリアボタン押下時に押下された行を初期値にする。
    $(".conditionformat-clear-buttons").click(function() {
        clearFields($($(this).parents("tr")[0]));
    });

    //「保存する」ボタン押下時に入力情報を設定する
    $("#conditionformat-submit").click(function() {
        var vals = getValues();
        if (checkValues(vals)) {
            saveConfig(vals);
        }
    });

    //「キャンセル」ボタン押下時の処理
    $("#conditionformat-cancel").click(function() {
        window.history.back();
    });

    //行コピーボタン押下時の処理
    $(".copy-row").click(function(){
      copyRow($($(this).parents("tr")[0]));
    });
    //行削除ボタン押下時の処理
    $(".remove-row").click(function(){
      removeRow($($(this).parents("tr")[0]));
    });

    initRows();
})(jQuery, kintone.$PLUGIN_ID);
