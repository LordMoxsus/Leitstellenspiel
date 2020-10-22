// ==UserScript==
// @name         shortkeyMissingVehicles
// @version      1.0.0
// @description  add a new short-key for loading missing vehicles
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/missions/*
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    $(".missing_vehicles_load:first")
        .before(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#smvModal" style="height:24px">
                 Einstellungen Short-Key
                 </button>
                 <div class="modal fade" id="smvModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                 <div class="modal-dialog" role="document">
                 <div class="modal-content">
                 <div class="modal-header">
                 <h5 class="modal-title" id="smvModalLabel">Einstellungen</h5>
                 <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                 <span aria-hidden="true">&times;</span>
                 </button>
                 </div>
                 <div class="modal-body" id="smvModalBody">
                 Bitte den Short-Key eingeben. Groß- und Kleinschreibung muss beachtet werden!<br>
                 <div style="display:flex">
                 <input type="text" class="form-control form-control-sm" value="${localStorage.smv_key}" id="smvShortKey" style="height:22px;flex:0.25">
                 <label class="form-check-label" for="smvShortKey" style="flex:1">Short-Key</label>
                 </div><br>
                 Folgende Short-Keys sind vom Spiel schon belegt:<br>
                 <small>
                 <table>
                 <tr>
                 <th class="col-1">Key</th>
                 <th class="col">Funktion</th>
                 <th class="col-1">Key</th>
                 <th class="col">Funktion</th>
                 <th class="col-1">Key</th>
                 <th class="col">Funktion</th>
                 </tr>
                 <tr>
                 <td class="col-1">x</td>
                 <td class="col">Alarmieren</td>
                 <td class="col-1">s</td>
                 <td class="col">Alarmieren + nächster Einsatz
                 <td class="col-1">w</td>
                 <td class="col">Einsatz freigeben</td>
                 </tr>
                 <tr>
                 <td class="col-1">n</td>
                 <td class="col">fehlende Fahrzeuge nachladen</td>
                 <td class="col-1">e</td>
                 <td class="col">Alarmieren, freigeben + nächster Einsatz</td>
                 <td class="col-1">a</td>
                 <td class="col">Vorheriger Einsatz</td>
                 </tr>
                 <tr>
                 <td class="col-1">d</td>
                 <td class="col">Nächster Einsatz</td>
                 <td class="col-1">q</td>
                 <td class="col">Sprechwünsche</td>
                 <td class="col-1">1-9</td>
                 <td class="col">Fahrzeuge an Position 1 - 9 in Fahrzeugliste auswählen</td>
                 </tr>
                 </table>
                 </small>
                 <div class="modal-footer">
                 <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                 <button type="button" class="btn btn-success" id="smvSavePreferences">Speichern</button>
                 </div>
                 </div>
                 </div>
                 </div>`);

    $("body").on("keypress", function(e) {
        if($("input:text").is(":focus") || $("textarea").is(":focus") || $("input[type='search']").is(":focus")) return true;
        if(e.key === localStorage.smv_key) {
            $(".missing_vehicles_load").first().click();
        }
    });

    $("body").on("click", "#smvSavePreferences", function() {
        localStorage.smv_key = $("#smvShortKey").val();
        $("#smvSavePreferences").css({"display":"none"});
        $("#smvModalBody").html("<h3><center>Die Einstellungen wurden gespeichert.</center></h5>");
    });

})();
