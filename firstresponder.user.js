// ==UserScript==
// @name         FirstResponder (Original by JuMaHo)
// @version      1.2.0
// @description  wählt das nächstgelegene FirstResponder-Fahrzeug aus
// @author       DrTraxx
// @match        *://www.leitstellenspiel.de/missions/*
// @match        *://www.leitstellenspiel.de/aaos/*/edit
// @match        *://www.missionchief.co.uk/missions/*
// @match        *://www.missionchief.co.uk/aaos/*/edit
// @match        *://www.missionchief.com/missions/*
// @match        *://www.missionchief.com/aaos/*/edit
// @grant        none
// ==/UserScript==
/* global $,I18n */

(async function() {
    'use strict';

    if(!localStorage.firstResponder) localStorage.firstResponder = JSON.stringify({"vehicleTypes":{},"aaoId":{}});

    var aVehicleTypes = [];
    var frSettings = JSON.parse(localStorage.firstResponder);
    var lang = I18n.locale;

    if(lang == "de_DE") {
        if(!localStorage.aVehicleTypesNew || JSON.parse(localStorage.aVehicleTypesNew).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) {
            await $.getJSON("https://drtraxx.github.io/vehicletypes.json").done(data => localStorage.setItem('aVehicleTypesNew', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        }
        aVehicleTypes = JSON.parse(localStorage.aVehicleTypesNew).value;
    } else {
        if(!localStorage.aVehicleTypes || !JSON.parse(localStorage.aVehicleTypes).language || JSON.parse(localStorage.aVehicleTypes).lastUpdate < (new Date().getTime() - 5 * 1000 * 60) || JSON.parse(localStorage.aVehicleTypes).language != lang) {
            await $.getJSON("https://lss-manager.de/api/cars.php?lang="+lang).done(data => localStorage.setItem('aVehicleTypes', JSON.stringify({lastUpdate: new Date().getTime(), value: data, language: lang})) );
        }
        aVehicleTypes = JSON.parse(localStorage.aVehicleTypes).value;
    }

    if(!frSettings.vehicleTypes[lang]) frSettings.vehicleTypes[lang] = [];

    function mapVehicles(arrClasses, trigger) {
        var returnValue = [];
        if(trigger == "type") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypes.filter((obj) => obj.name == item)[0].id;
            });
        } else if(trigger == "name") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypes.filter((obj) => obj.id == item)[0].name;
            });
        }
        return returnValue;
    }

    if(window.location.pathname.includes("aaos") && window.location.pathname.includes("edit")) {
        $(".boolean.optional.checkbox")
            .before(`<label class="form-check-label" for="frSaveAaoId">
                    <input class="form-check-input" type="checkbox" id="frSaveAaoId" ${window.location.pathname.includes(frSettings.aaoId[lang]) ? "checked" : ""}>
                    ${lang == "de_DE" ? "Diese ID für den First Responder nutzen." : "Use this id for FirstResponder."}
                    </label>`);
    }

    if(window.location.pathname.includes("missions")) {
        var arrVehicles = [];

        for(var i in aVehicleTypes) {
            arrVehicles.push(aVehicleTypes[i].name);
        }
        arrVehicles.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        if(lang == "de_DE" && frSettings.aaoId[lang]) {
            $("#available_aao_" + frSettings.aaoId[lang])
                .parent()
                .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                        <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                        </button>
                        <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                        <h5 class="modal-title" id="frModalLabel">Einstellungen</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div class="modal-body" id="frModalBody">
                        <label for="frSelectVehicles">Fahrzeugtypen (Mehrfachauswahl mit Strg + Klick)</label>
                        <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:40em"></select>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                        <button type="button" class="btn btn-success" id="frSavePreferences">Speichern</button>
                        </div>
                        </div>
                        </div>
                        </div>`);
        } else if(lang != "de_DE" && frSettings.aaoId[lang]) {
            $("#available_aao_" + frSettings.aaoId[lang])
                .parent()
                .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                        <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                        </button>
                        <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                        <div class="modal-dialog" role="document">
                        <div class="modal-content">
                        <div class="modal-header">
                        <h5 class="modal-title" id="frModalLabel">Settings</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                        </button>
                        </div>
                        <div class="modal-body" id="frModalBody">
                        <label for="frSelectVehicles">vehicle-types (multiple-choice with Strg + click)</label>
                        <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:20em"></select>
                        </div>
                        <div class="modal-footer">
                        <button type="button" class="btn btn-danger" data-dismiss="modal">close</button>
                        <button type="button" class="btn btn-success" id="frSavePreferences">save</button>
                        </div>
                        </div>
                        </div>
                        </div>`);
        }

        for(i in arrVehicles) {
            $("#frSelectVehicles").append(`<option>${arrVehicles[i]}</option>`);
        }

        $("#frSelectVehicles").val(mapVehicles(frSettings.vehicleTypes[lang], "name"));
    }

    $("body").on("click", "#frSaveAaoId", function() {
        if($("#frSaveAaoId")[0].checked) {
            frSettings.aaoId[lang] = window.location.pathname.replace(/\D+/g,"");
        } else {
            delete frSettings.aaoId[lang];
        }
        localStorage.firstResponder = JSON.stringify(frSettings);
    });

    $("body").on("click", "#frSavePreferences", function() {
        frSettings.vehicleTypes[lang] = mapVehicles($("#frSelectVehicles").val(), "type");
        localStorage.firstResponder = JSON.stringify(frSettings);
        $("#frSavePreferences").css({"display":"none"});

        if(lang == "de_DE") {
            $("#frModalBody").html("<h3><center>Die Einstellungen wurden gespeichert.</center></h5>");
        } else {
            $("#frModalBody").html("<h3><center>Settings successfully saved.</center></h5>");
        }
    });

    $("#aao_" + frSettings.aaoId[lang]).click(function() {
        $(".vehicle_checkbox").each(function() {
            var vType = +$(this).attr("vehicle_type_id");
            var vId = $(this).attr("value");

            if(frSettings.vehicleTypes[lang].includes(vType)) {
                if(!$("#vehicle_checkbox_"+vId)[0].checked) {
                    if(!$("#vehicle_checkbox_"+vId)[0].disabled) {
                        $("#vehicle_checkbox_"+vId).click();
                        return false;
                    }
                }
            }
        });
    });

})();
