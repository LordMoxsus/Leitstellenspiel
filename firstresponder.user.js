// ==UserScript==
// @name         FirstResponder (Original by JuMaHo)
// @version      1.0.0
// @description  wählt das nächstgelegene FirstResponder-Fahrzeug aus
// @author       DrTraxx
// @match        *://www.leitstellenspiel.de/missions/*
// @match        *://www.leitstellenspiel.de/aaos/*/edit
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    if(!localStorage.aVehicleTypesNew || JSON.parse(localStorage.aVehicleTypesNew).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON("https://drtraxx.github.io/vehicletypes.json").done(data => localStorage.setItem('aVehicleTypesNew', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );

    var aVehicleTypesNew = JSON.parse(localStorage.aVehicleTypesNew).value;
    var vehicleTypes = localStorage.fr_vehicleTypes ? JSON.parse(localStorage.fr_vehicleTypes) : [];
    var aaoId = localStorage.fr_aaoId ? +localStorage.fr_aaoId : 0;
    console.log(aaoId);

    function mapVehicles(arrClasses, trigger) {
        var returnValue = [];
        if(trigger == "type") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesNew.filter((obj) => obj.short_name == item)[0].id;
            });
        } else if(trigger == "name") {
            returnValue = $.map(arrClasses, function(item) {
                return aVehicleTypesNew.filter((obj) => obj.id == item)[0].short_name;
            });
        }
        return returnValue;
    }

    if(window.location.pathname.includes("aaos") && window.location.pathname.includes("edit") && !localStorage.fr_aaoId) {
        $("h1").append(`<a class="btn btn-info" id="frSaveAaoId" style="margin-left:2em">AAO-ID speichern</a>`);
    }

    if(window.location.pathname.includes("missions") && localStorage.fr_aaoId) {
        var arrVehicles = [];

        for(var i in aVehicleTypesNew) {
            arrVehicles.push(aVehicleTypesNew[i].short_name);
        }
        arrVehicles.sort((a, b) => a.toUpperCase() > b.toUpperCase() ? 1 : -1);

        $("#available_aao_" + aaoId)
            .parent()
            .after(`<button type="button" class="btn btn-success btn-xs" data-toggle="modal" data-target="#frModal" style="height:24px">
                      <div class="glyphicon glyphicon-cog" style="color:LightSteelBlue"></div>
                    </button>
                    <div class="modal fade" id="frModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
                      <div class="modal-dialog" role="document">
                        <div class="modal-content">
                          <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLabel">Einstellungen</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div class="modal-body" id="frModalBody">
                            <label for="frSelectVehicles">Fahrzeugtypen (Mehrfachauswahl mit Strg + Klick)</label>
                            <select multiple class="form-control" id="frSelectVehicles" style="height:20em;width:20em"></select>
                          </div>
                          <div class="modal-footer">
                            <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                            <button type="button" class="btn btn-success" id="frSavePreferences">Speichern</button>
                          </div>
                        </div>
                      </div>
                    </div>`);

        for(i in arrVehicles) {
            $("#frSelectVehicles").append(`<option>${arrVehicles[i]}</option>`);
        }

        $("#frSelectVehicles").val(mapVehicles(vehicleTypes, "name"));
    }

    $("body").on("click", "#frSaveAaoId", function() {
        localStorage.fr_aaoId = +window.location.pathname.replace(/\D+/g,"");
        $("#frSaveAaoId").css({"display":"none"});
        alert("AAO-ID gespeichert.");
    });

    $("body").on("click", "#frSavePreferences", function() {
        vehicleTypes = mapVehicles($("#frSelectVehicles").val(), "type");
        localStorage.fr_vehicleTypes = JSON.stringify(vehicleTypes);

        $("#frModalBody").html("<h3><center>Die Einstellungen wurden gespeichert.</center></h5>");
        $("#frSavePreferences").css({"display":"none"});
    });

    $("#aao_"+aaoId).click(function() {
        $(".vehicle_checkbox").each(function() {
            var vType = +$(this).attr("vehicle_type_id");
            var vId = +$(this).attr("value");

            if(vehicleTypes.includes(vType)) {
                if(!$("#vehicle_checkbox_"+vId)[0].checked) {
                    $("#vehicle_checkbox_"+vId).click();
                    return false;
                }
            }
        });
    });

})();
