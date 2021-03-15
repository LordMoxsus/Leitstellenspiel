// ==UserScript==
// @name         renameManager
// @version      1.4.3
// @description  Fahrzeuge umbenennen
// @author       DrTraxx
// @include      /^https?:\/\/(?:w{3}\.)?(?:polizei\.)?leitstellenspiel\.de\/$/
// @include      /^https?:\/\/(?:w{3}\.)?(?:polizei\.)?leitstellenspiel\.de\/buildings\/\d+$/
// @grant        GM_addStyle
// @require      https://drtraxx.github.io/js/api_request.1.0.0.js
// ==/UserScript==
/* global $, user_id, getVehicleTypes, singleVehicle, getApi, singleBuilding */

(async function() {
    'use strict';

    GM_addStyle(`.modal {
display: none;
position: fixed; /* Stay in place front is invalid - may break your css so removed */
padding-top: 100px;
left: 0;
right:0;
top: 0;
bottom: 0;
overflow: auto;
background-color: rgb(0,0,0);
background-color: rgba(0,0,0,0.4);
z-index: 9999;
}
.modal-body{
height: 650px;
overflow-y: auto;
}`);

    $("body")
        .prepend(`<div class="modal fade bd-example-modal-lg" id="reMaModal" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg" role="document">
                      <div class="modal-content">
                        <div class="modal-header">
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&#x274C;</span>
                          </button>
                          <h4 class="modal-title"><center>Rename-Manager</center></h4>
                          <div class="btn-group">
                           <a class="btn btn-success btn-xs" id="reMaVeTypes">Fahrzeugtypen</a>
                           <a class="btn btn-success btn-xs" id="reMaBuTypes">Wachentypen</a>
                           <a class="btn btn-success btn-xs" id="reMaBuFields">Rename-Felder</a>
                          </div>
                          <select class="custom-select" id="reMaSelBuType">
                            <option selected>Gebäudetyp wählen</option>
                          </select>
                        </div>
                          <div class="modal-body" id="reMaModalBody">
                          </div>
                          <div class="modal-footer">
                            <div class="btn-group pull-right">
                              <a class="btn btn-success" id="reMaSave" save_type="">Speichern</a>
                              <button type="button" class="btn btn-danger" data-dismiss="modal">Schließen</button>
                            </div>
                            <div class="pull-left">v ${GM_info.script.version}</div>
                          </div>
                    </div>
                  </div>`);

    $("#navbar_profile_link")
        .parent()
        .after(`<li role="presentation"><a style="cursor:pointer" id="renameManagement" data-toggle="modal" data-target="#reMaModal" ><span class="glyphicon glyphicon-home"></span> Rename-Manager</a></li>`);

    var aVehicleTypesNew = await getVehicleTypes();
    var aBuildings = await getApi("buildings");
    var aVehicles = [];
    var placeholderDatabase = "=====DATABASE_RENAME_MANAGER=====";
    var databaseStart = "=====DATABASE=====";
    var renameRegex = /(?:=====DATABASE_RENAME_MANAGER=====\n)(?<json>\{.+\})/gm;
    var config = {};
    var personalNotes = "";
    var databases = "";
    var buildingTypes = [
        {"id": 0, "name": "Feuerwehr"},
        {"id": 2, "name": "Rettungswache"},
        {"id": 5, "name": "Rettungshubschrauber-Station"},
        {"id": 6, "name": "Polizei"},
        {"id": 9, "name": "THW"},
        {"id": 11, "name": "Bereitschaftspolizei"},
        {"id": 12, "name": "SEG"},
        {"id": 13, "name": "Polizeihubschrauber-Station"},
        {"id": 15, "name": "Wasserrettungswache"},
        {"id": 17, "name": "Polizei Sondereinheiten"},
        {"id": 21, "name": "Rettungshundestaffel"}
    ];

    async function getConfig() {
        await $.get("/note", function(data) {
            if($("#note_message", data).text().includes(databaseStart)) {
                personalNotes = $("#note_message", data).text().split(databaseStart)[0].trim();
                databases = $("#note_message", data).text().split(databaseStart)[1].trim();
                config = JSON.parse(databases.match(renameRegex)[0].replace(placeholderDatabase, "").trim());
            } else {
                personalNotes = $("#note_message", data).text().trim();
                config = {};
            }
        });

        if(!config.vehicle_types) {
            config.vehicle_types = {};
            for(var a in aVehicleTypesNew) {
                var c = aVehicleTypesNew[a];
                config.vehicle_types[c.id] = {};
                config.vehicle_types[c.id].alias_one = c.short_name;
                config.vehicle_types[c.id].alias_two = c.name;
            }
            await saveInNotes();
        }
    }

    for(var i in buildingTypes) {
        var e = buildingTypes[i];
        $("#reMaSelBuType").append(`<option value="${e.id}">${e.name}</option>`);
    }

    async function saveInNotes() {
        await $.get("/note", function(data) {
            if($("#note_message", data).text().includes(databaseStart)) {
                personalNotes = $("#note_message", data).text().split(databaseStart)[0].trim();
                databases = $("#note_message", data).text().split(databaseStart)[1].trim();
            } else {
                personalNotes = $("#note_message", data).text().trim();
            }
        });
        console.debug("config beim Speichern", config);
        var databaseContent = personalNotes + "\n\n\n\n\n" + databaseStart + "\n" + (databases.includes(placeholderDatabase) ? databases.replace(renameRegex, placeholderDatabase + "\n" + JSON.stringify(config)) : (databases ? (databases + "\n" + placeholderDatabase + "\n" + JSON.stringify(config)) : (placeholderDatabase + "\n" + JSON.stringify(config))));
        await $.post("/note", {"note": {"message": databaseContent}, "authenticity_token" : $("meta[name=csrf-token]").attr("content"), "_method": "put"});
    }

    async function saveToLocalStorage(type) {
        var i, e;
        if(!config[type]) config[type] = {};
        if(type == "vehicle_types") {
            for(i in aVehicleTypesNew) {
                e = aVehicleTypesNew[i];
                if(!config[type][e.id]) config[type][e.id] = {};
                config[type][e.id].alias_one = $("#alias_one_"+e.id).val() ? $("#alias_one_"+e.id).val().trim() : "";
                config[type][e.id].alias_two = $("#alias_two_"+e.id).val() ? $("#alias_two_"+e.id).val().trim() : "";
            }
        } else if(type == "building_types") {
            for(i in buildingTypes) {
                e = buildingTypes[i];
                if(!config[type][e.id]) config[type][e.id] = {};
                config[type][e.id].alias_one = $("#alias_one_"+e.id).val() ? $("#alias_one_"+e.id).val().trim() : "";
                config[type][e.id].alias_two = $("#alias_two_"+e.id).val() ? $("#alias_two_"+e.id).val().trim() : "";
            }
        } else if(type == "buildings") {
            for(i in aBuildings) {
                e = aBuildings[i];
                if(e.building_type == $("#reMaSelBuType").val()) {
                    if(!config[type][e.id]) config[type][e.id] = {};
                    config[type][e.id].alias_one = $("#alias_one_"+e.id).val() ? $("#alias_one_"+e.id).val().trim() : "";
                    config[type][e.id].alias_two = $("#alias_two_"+e.id).val() ? $("#alias_two_"+e.id).val().trim() : "";
                }
            }
        } else if(type == "rename_fields") {
            delete config[type];
            if(!config.building_types) config.building_types = {};
            $("#reMaModalBody input[id*='reMaRenameTextarea_']").each(function() {
                var $this = $(this);
                var fieldId = +$this.attr("id").replace(/\D+/g, "");
                var fieldValue = $this.val().trim();
                if(!config.building_types[fieldId]) config.building_types[fieldId] = {};
                config.building_types[fieldId].textarea = fieldValue;
            });
        }
        await saveInNotes();
        alert("Die Einstellungen wurden gespeichert.");
        console.debug("Einstellungen im Modal gespeichert!", config);
    }

    async function buildingTable(filterType, type) {
        var buildingDatabase = aBuildings.slice(0);
        var modalContent = `<table class="table">
                              <thead>
                                <tr>
                                  <th class="col">Bezeichnung</th>
                                  <th class="col">Alias 1</th>
                                  <th class="col">Alias 2</th>
                                </tr>
                              </thead>
                              <tbody>`;
        var i, e;

        for(i = buildingDatabase.length - 1; i >= 0; i--) {
            e = buildingDatabase[i];
            if(e.building_type != filterType) buildingDatabase.splice(i, 1);
        }

        buildingDatabase.sort((a, b) => a.caption.toUpperCase() > b.caption.toUpperCase() ? 1 : -1);

        for(i in buildingDatabase) {
            e = buildingDatabase[i];
            modalContent += `<tr>
                               <td class="col">
                                 <a class="lightbox-open" href="/buildings/${e.id}">${e.caption}</a>
                                 <br>
                                 <span class="badge badge-info" lat="${e.latitude}" lon="${e.longitude}" style="cursor:pointer">Landkreis oder kreisfreie Stadt anzeigen</span>
                               </td>
                               <td class="col">
                                 <input type="text" class="form-control form-control-sm" value="${config[type] && config[type][e.id] && config[type][e.id].alias_one ? config[type][e.id].alias_one : ""}" id="alias_one_${e.id}">
                               </td>
                               <td class="col">
                                 <input type="text" class="form-control form-control-sm" value="${config[type] && config[type][e.id] && config[type][e.id].alias_two ? config[type][e.id].alias_two : ""}" id="alias_two_${e.id}">
                               </td>
                             </tr>`;
        }
        modalContent += "</tbody></table>";
        $("#reMaSave").attr("save_type", type);
        $("#reMaModalBody").html(modalContent);
    }

    async function buildingAndVehicleTypeTable(arrDatabase, type) {
        //arrDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
        var modalContent = `<table class="table">
                              <thead>
                                <tr>
                                  <th class="col">Bezeichnung</th>
                                  <th class="col">Alias 1</th>
                                  <th class="col">Alias 2</th>
                                </tr>
                              </thead>
                              <tbody>`;

        for(var i in arrDatabase) {
            var e = arrDatabase[i];
            modalContent += `<tr>
                               <td class="col">${e.name}${e.short_name ? ("<br>("+e.short_name+")") : ""}</td>
                               <td class="col">
                                 <input type="text" class="form-control form-control-sm" value="${config[type] && config[type][e.id] && config[type][e.id].alias_one ? config[type][e.id].alias_one : ""}" id="alias_one_${e.id}">
                               </td>
                               <td class="col">
                                 <input type="text" class="form-control form-control-sm" value="${config[type] && config[type][e.id] && config[type][e.id].alias_two ? config[type][e.id].alias_two : ""}" id="alias_two_${e.id}">
                               </td>
                             </tr>`;
        }
        modalContent += "</tbody></table>";
        $("#reMaSave").attr("save_type", type);
        $("#reMaModalBody").html(modalContent);
    }

    function convertToRoman(num) {

        var roNumerals = {
            M: Math.floor(num / 1000),
            CM: Math.floor(num % 1000 / 900),
            D: Math.floor(num % 1000 % 900 / 500),
            CD: Math.floor(num % 1000 % 900 % 500 / 400),
            C: Math.floor(num % 1000 % 900 % 500 % 400 / 100),
            XC: Math.floor(num % 1000 % 900 % 500 % 400 % 100 / 90),
            L: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 / 50),
            XL: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 / 40),
            X: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 % 40 / 10),
            IX: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 % 40 % 10 / 9),
            V: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 % 40 % 10 % 9 / 5),
            IV: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 % 40 % 10 % 9 % 5 / 4),
            I: Math.floor(num % 1000 % 900 % 500 % 400 % 100 % 90 % 50 % 40 % 10 % 9 % 5 % 4 / 1)
        };
        var roNuStr = "";

        for (var prop in roNumerals) {
            for (i = 0; i < roNumerals[prop]; i++) {
                roNuStr += prop;
            }

        }
        return roNuStr;
    }

    function renameVehicle(ipt, buildingId, buildingType, vehicleType, counter, buildingName) {
        return new Promise(function(resolve) {
            var buildingAliasOne = config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_one ? config.buildings[buildingId].alias_one : "unbekannt";
            var buildingAliasTwo = config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_two ? config.buildings[buildingId].alias_two : "unbekannt";
            var buildingTypeAliasOne = config.building_types && config.building_types[buildingType] && config.building_types[buildingType].alias_one ? config.building_types[buildingType].alias_one : "unbekannt";
            var buildingTypeAliasTwo = config.building_types && config.building_types[buildingType] && config.building_types[buildingType].alias_two ? config.building_types[buildingType].alias_two : "unbekannt";
            var vehicleTypeAliasOne = config.vehicle_types && config.vehicle_types[vehicleType] && config.vehicle_types[vehicleType].alias_one ? config.vehicle_types[vehicleType].alias_one : "unbekannt";
            var vehicleTypeAliasTwo = config.vehicle_types && config.vehicle_types[vehicleType] && config.vehicle_types[vehicleType].alias_two ? config.vehicle_types[vehicleType].alias_two : "unbekannt";
            var outCount = config.building_types && config.building_types[buildingType] && config.building_types[buildingType].zero_before && counter < 10 ? `0${counter}` : counter;
            var output = ipt
            .replace("{Fahrzeugtyp-Alias 1}", vehicleTypeAliasOne).replace("{Fahrzeugtyp-Alias 2}", vehicleTypeAliasTwo)
            .replace("{Wachentyp-Alias 1}", buildingTypeAliasOne).replace("{Wachentyp-Alias 2}", buildingTypeAliasTwo)
            .replace("{Wachen-Alias 1}", buildingAliasOne).replace("{Wachen-Alias 2}", buildingAliasTwo)
            .replace("{Wachenname}", buildingName).replace("{Zähler}", outCount)
            .replace("{röm. Ziffer}", convertToRoman(counter)).replace("{Buchstabe}", String.fromCharCode(counter+64));
            resolve(output);
        });
    }

    if(window.location.href.includes("/buildings/")) {
        var found = $.map(buildingTypes, function(value) {
            if(value.id == $("h1").attr("building_type")) return true;
        });
        if(found.length === 0) found.push(false);

        if(found[0] === false && $("h1").attr("building_type") != "7") return false;

        await getConfig();
        var buildingId = window.location.href.replace(/\D+/g, "");
        var buildingType = $("h1").attr("building_type");
        var buildingName = $("h1")[0].firstChild.textContent;
        var building = aBuildings.filter((obj) => obj.id == buildingId)[0];
        var renamed = false;
        var buildingCounty = "";
        var vehicles = [];

        await $.getJSON("https://nominatim.openstreetmap.org/reverse?format=json&lat="+building.latitude+"&lon="+building.longitude+"&zoom=18&addressdetails=1", function(data) {
            $(".active:first").after("<span class='label label-info' style='cursor:default;margin-left:2em'>"+(data.address.county ? data.address.county : (data.address.city ? data.address.city : (data.address.town ? data.address.town : data.address.state)))+"</span>");
            buildingCounty = (data.address.county ? data.address.county : (data.address.city ? data.address.city : (data.address.town ? data.address.town : data.address.state))).replace(/^\w+\s/g, "");
        });

        $("#vehicle_table")
            .before(`<a class="btn btn-success btn-xs" id="reMaTriggerRename">
                       <span class="glyphicon glyphicon-eye-close"> RenameManager</span>
                     </a>
                     <a class="btn btn-success btn-xs" id="reMaTriggerBuildingAlias">
                       <span class="glyphicon glyphicon-eye-close"> Wachen-Alias</span>
                     </a>
                     <a class="btn btn-success btn-xs" id="reMaTriggerBuildingTypeAlias">
                       <span class="glyphicon glyphicon-eye-close"> Wachentyp-Alias</span>
                     </a>
                     <div class="hidden" id="reMaBuildingTypeAlias">
                       <div class="form-group" style="display:inline-block">
                         <label for="reMaBuildingTypeAliasOne">Wachentyp-Alias 1</label>
                         <input type="text" class="form-control" id="reMaBuildingTypeAliasOne" value="${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].alias_one ? config.building_types[buildingType].alias_one : ""}">
                       </div>
                       <div class="form-group" style="display:inline-block">
                         <label for="reMaBuildingTypeAliasTwo">Wachentyp-Alias 2</label>
                         <input type="text" class="form-control" id="reMaBuildingTypeAliasTwo" value="${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].alias_two ? config.building_types[buildingType].alias_two : ""}">
                       </div>
                       <a class="btn btn-success" id="reMaSaveBuildingTypeAliasBuilding">Wachentyp-Alias speichern</a>
                     </div>
                     <div class="hidden" id="reMaBuildingAlias">
                       <div class="form-group" style="display:inline-block">
                         <label for="reMaBuildingTypeAliasOne">Wachen-Alias 1</label>
                         <input type="text" class="form-control" id="reMaBuildingAliasOne" value="${config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_one ? config.buildings[buildingId].alias_one : ""}">
                       </div>
                       <div class="form-group" style="display:inline-block">
                         <label for="reMaBuildingTypeAliasTwo">Wachen-Alias 2</label>
                         <input type="text" class="form-control" id="reMaBuildingAliasTwo" value="${config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_two ? config.buildings[buildingId].alias_two : ""}">
                       </div>
                       <a class="btn btn-success" id="reMaSaveBuildingAliasBuilding">Wachen-Alias speichern</a>
                     </div>
                     <div class="hidden" id="reMaRenameField">
                       <div class="btn-group" style="display:flex">
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Fahrzeugtyp-Alias 1}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Fahrzeugtyp-Alias 2}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Wachentyp-Alias 1}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Wachentyp-Alias 2}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Wachen-Alias 1}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Wachen-Alias 2}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Wachenname}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Zähler}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{röm. Ziffer}</a>
                         <a class="btn btn-info btn-xs placeholder" style="flex:1">{Buchstabe}</a>
                       </div>
                       <input type="text" class="form-control" id="reMaRenameTextarea" value="${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].textarea ? config.building_types[buildingType].textarea : ""}">
                       <div class="form-check">
                         <input type="checkbox" class="form-check-input" id="reMaZeroBefore" ${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].zero_before ? "checked" : ""}>
                         <label class="form-check-label" for="reMaZeroBefore">0 vor einstelligem Zähler</label>
                       </div>
                       <div class="form-check">
                         <input type="checkbox" class="form-check-input" id="reMaCountyAlias1" ${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].county ? "checked" : ""}>
                         <label class="form-check-label" for="reMaCountyAlias1">Landkreis/ kreisfreie Stadt als Wachen-Alias 1</label>
                       </div>
                       <div class="form-check">
                         <input type="checkbox" class="form-check-input" id="reMaNoKnown" ${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].known_vehicles ? "checked" : ""}>
                         <label class="form-check-label" for="reMaNoKnown">kein Textfeld bei übereinstimmenden Namen generieren</label>
                       </div>
                       <div class="btn-group">
                         <a class="btn btn-info" id="reMaStartRenameBuilding">Umbenennen</a>
                         <a class="btn btn-success" id="reMaSaveNamesBuilding">Alle speichern</a>
                       </div>
                       <span class="label label-info" id="reMaStatus">Status: Warte auf Eingabe</span>
                     </div>`);

        if(config.building_types && config.building_types[buildingType] && config.building_types[buildingType].county) {
            $("#reMaBuildingAliasOne").val(config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_one ? config.buildings[buildingId].alias_one : buildingCounty);
        }
    }

    $("h1").attr("building_type") == "7" && $('#tab_vehicle').on('DOMNodeInserted', 'script', async function(){
        aVehicles = await getApi("vehicles");
        $("#vehicle_table")
            .before(`<a class="btn btn-success btn-xs" id="reMaTriggerRename">
                       <span class="glyphicon glyphicon-eye-close"> RenameManager</span>
                     </a>
                     <a class="btn btn-success btn-xs" id="renameManagement" data-toggle="modal" data-target="#reMaModal">
                       <span class="glyphicon glyphicon-cog"> Einstellungen</span>
                     </a>
                     <div class="hidden" id="reMaRenameField">
                       <input type="text" class="form-control" value="Das Textfeld der Wachentypen wird in der Leitstelle übernommen." readonly>
                       <div class="form-check">
                         <input type="checkbox" class="form-check-input" id="reMaNoKnown" ${config.building_types && config.building_types[buildingType] && config.building_types[buildingType].known_vehicles ? "checked" : ""}>
                         <label class="form-check-label" for="reMaNoKnown">kein Textfeld bei übereinstimmenden Namen generieren</label>
                       </div>
                       <div class="btn-group">
                         <a class="btn btn-info" id="reMaStartRenameDispatch">Umbenennen</a>
                         <a class="btn btn-success" id="reMaSaveNamesDispatch">Alle speichern</a>
                       </div>
                       <span class="label label-info" id="reMaStatus">Status: Warte auf Eingabe</span>
                     </div>`);
    });

    async function getDispatchVehicles() {
        return new Promise(function(resolve) {
            var arrReturn = [];
            $("#reMaStatus").text("Sammle Daten.");
            $('#vehicle_table >> tr:not(.tablesorter-headerRow)').each(async function() {
                var $this = $(this);
                var vehicleId = +$this.children("td").children("span").attr("id").replace(/\D+/g, "");
                var vehicle = aVehicles.filter((obj) => obj.id == vehicleId)[0];
                var building = aBuildings.filter((obj) => obj.id == vehicle.building_id)[0];
                arrReturn. push({
                    "vId": vehicleId,
                    "vType": vehicle.vehicle_type,
                    "bId": building.id,
                    "bType": building.building_type,
                    "bCaption": building.caption
                });
                if($('#vehicle_table >> tr:not(.tablesorter-headerRow)').length == arrReturn.length) {
                    $("#reMaStatus").text("Datensammlung abgeschlossen.");
                    resolve(arrReturn);
                }
            });
        });
    }

    async function renameVehicles() {
        for(var i in vehicles){
            var e = vehicles[i];
            $("#reMaStatus").text("Benenne Fahrzeug "+(+i+1).toLocaleString()+" von "+vehicles.length.toLocaleString()+" um.");
            if(!$("#reMaRename_"+e.vId).length) continue;
            if($("#reMaRename_"+e.vId).val() !== $("#vehicle_link_"+e.vId).text()) {
                await $.post("/vehicles/"+e.vId, {"vehicle": {"caption": $("#reMaRename_"+e.vId).val().trim()}, "authenticity_token" : $("meta[name=csrf-token]").attr("content"), "_method": "put"});
                if(buildingType == 7) {
                    $("#vehicle_link_"+e.vId).text($("#reMaRename_"+e.vId).val().trim());
                } else {
                    $("a[href='/vehicles/"+e.vId+"']:not(.btn)").text($("#reMaRename_"+e.vId).val().trim());
                }
                $("#reMaRename_"+e.vId).remove();
                $("#reMaSaveNameVehicle_"+e.vId).remove();
            } else {
                $("#reMaRename_"+e.vId).remove();
                $("#reMaSaveNameVehicle_"+e.vId).remove();
            }

        }
        $("#reMaStatus").text("Alle Fahrzeuge erfolgreich umbenannt.");
    }

    $("body").on("click", "#reMaStartRenameDispatch", async function() {
        var counterTypes = {};
        vehicles = await getDispatchVehicles();

        if(vehicles.length > 1) vehicles.sort((a, b) => a.vId > b.vId ? 1 : -1);

        for(var i in vehicles) {
            var e = vehicles[i];
            $("#reMaStatus").text("Generiere Name "+(+i+1).toLocaleString()+" von "+vehicles.length.toLocaleString());
            if(!counterTypes[e.bId]) counterTypes[e.bId] = {};
            counterTypes[e.bId][e.vType] ? counterTypes[e.bId][e.vType]++ : counterTypes[e.bId][e.vType] = 1;
            var confBuildingType = config.building_types && config.building_types[e.bType] ? config.building_types[e.bType] : {};
            var confBuilding = config.buildings && config.buildings[e.bId] ? config.buildings[e.bId] : {};
            if(confBuildingType.textarea && !$("#reMaRename_"+e.vId).length) {
                var vehicleNewName = await renameVehicle(confBuildingType.textarea, e.bId, e.bType, e.vType, counterTypes[e.bId][e.vType], e.bCaption);
                if($("#reMaNoKnown")[0].checked && vehicleNewName == $("#vehicle_link_"+e.vId).text()) {
                    continue;
                }
                $("#vehicle_link_"+e.vId)
                    .after(`<input type="text" class="form-control" id="reMaRename_${e.vId}" value="${vehicleNewName}">
                            <a class="btn btn-success btn-xs saveSingleName" id="reMaSaveNameVehicle_${e.vId}">Speichern</a>`);
            }
            if($("#reMaRename_"+e.vId).length) {
                $("#reMaRename_"+e.vId).val(await renameVehicle(confBuildingType.textarea, e.bId, e.bType, e.vType, counterTypes[e.bId][e.vType], e.bCaption));
            }
        }
        $("#reMaStatus").text("Alle Fahrzeugnamen generiert.");
    });

    $("body").on("click", "#reMaSaveNamesDispatch", function() {
        renameVehicles();
    });

    async function getBuildingVehicles() {
        return new Promise(async function(resolve) {
            var arrReturn = [];
            $("#reMaStatus").text("Sammle Daten.");
            $('#vehicle_table >> tr:not(.tablesorter-headerRow)').each(async function() {
                var $this = $(this);
                var vehicleTable = $this.children("td").children("a[href*='/vehicles/']:not(.btn)");
                var vehicleId = vehicleTable.attr("href").replace(/\D+/g, "");
                var vehicle = await singleVehicle(vehicleId);
                if(vehicle) {
                    arrReturn.push({
                        "vId": vehicleId,
                        "vType": vehicle.vehicle_type
                    });
                }
                if(arrReturn.length == $('#vehicle_table >> tr:not(.tablesorter-headerRow)').length) {
                    $("#reMaStatus").text("Datensammlung abgeschlossen.");
                    resolve(arrReturn);
                }
            });
        });
    }

    $("body").on("click", "#reMaStartRenameBuilding", async function() {
        var counterTypes = {};
        vehicles = await getBuildingVehicles();

        if(vehicles.length > 1) vehicles.sort((a, b) => a.vId > b.vId ? 1 : -1);

        for(var i in vehicles) {
            var e = vehicles[i];
            $("#reMaStatus").text("Generiere Name "+(+i+1).toLocaleString()+" von "+vehicles.length.toLocaleString());
            counterTypes[e.vType] ? counterTypes[e.vType]++ : counterTypes[e.vType] = 1;
            var vehicleNewName = await renameVehicle($("#reMaRenameTextarea").val(), buildingId, buildingType, e.vType, counterTypes[e.vType], buildingName);
            if($("#reMaNoKnown")[0].checked && vehicleNewName == $("a[href='/vehicles/"+e.vId+"']:not(.btn)").text()) {
                continue;
            }
            if($("#reMaRenameTextarea").val() && !$("#reMaRename_"+e.vId).length) {
                renamed = true;
                $("a[href='/vehicles/"+e.vId+"']:not(.btn)")
                    .parent()
                    .append(`<input type="text" class="form-control" id="reMaRename_${e.vId}" value="${vehicleNewName}">
                             <a class="btn btn-success btn-xs saveSingleName" id="reMaSaveNameVehicle_${e.vId}">Speichern</a>`);
            }
            if($("#reMaRename_"+e.vId).length) {
                $("#reMaRename_"+e.vId).val(vehicleNewName);
            }
        }
        $("#reMaStatus").text("Alle Fahrzeugnamen generiert.");
    });

    $("body").on("click", "#vehicle_table .saveSingleName", async function() {
        var $this = $(this);
        var vehicleId = $this.attr("id").replace(/\D+/g, "");
        if($("#reMaRename_"+vehicleId).val()) {
            if($("#reMaRename_"+vehicleId).val() !== $("a[href='/vehicles/"+vehicleId+"']:not(.btn)").text()) {
                await $.post("/vehicles/"+vehicleId, {"vehicle": {"caption": $("#reMaRename_"+vehicleId).val().trim()}, "authenticity_token" : $("meta[name=csrf-token]").attr("content"), "_method": "put"});
                $("a[href='/vehicles/"+vehicleId+"']:not(.btn)").text($("#reMaRename_"+vehicleId).val().trim());
                $("#reMaRename_"+vehicleId).remove();
                $("#reMaSaveNameVehicle_"+vehicleId).remove();
            } else {
                $("#reMaRename_"+vehicleId).remove();
                $("#reMaSaveNameVehicle_"+vehicleId).remove();
            }
        }
    });

    $("body").on("click", "#reMaSaveBuildingTypeAliasBuilding", async function() {
        if(!config.building_types) config.building_types = {};
        if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
        config.building_types[buildingType].alias_one = $("#reMaBuildingTypeAliasOne").val().trim();
        config.building_types[buildingType].alias_two = $("#reMaBuildingTypeAliasTwo").val().trim();
        await saveInNotes();
        alert("Wachentyp-Alias gespeichert.");
        console.debug("Wachentyp-Alias im Gebäude gespeichert!" ,config);
    });

    $("body").on("click", "#reMaSaveBuildingAliasBuilding", async function() {
        if(!config.buildings) config.buildings = {};
        if(!config.buildings[buildingId]) config.buildings[buildingId] = {};
        config.buildings[buildingId].alias_one = $("#reMaBuildingAliasOne").val().trim();
        config.buildings[buildingId].alias_two = $("#reMaBuildingAliasTwo").val().trim();
        await saveInNotes();
        alert("Wachen-Alias gespeichert.");
        console.debug("Wachen-Alias im Gebäude gespeichert!" ,config);
    });

    $("body").on("click", "#reMaSaveNamesBuilding", async function() {
        if(renamed === true) {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].textarea = $("#reMaRenameTextarea").val().trim();
            await saveInNotes();

            renameVehicles();
        }
    });

    $("body").on("click", "#reMaTriggerRename", function() {
        if($("#reMaRenameField").hasClass("hidden")) {
            $("#reMaRenameField").removeClass("hidden");
            $("#reMaTriggerRename .glyphicon").removeClass("glyphicon-eye-close").addClass("glyphicon-eye-open");
        } else {
            $("#reMaRenameField").addClass("hidden");
            $("#reMaTriggerRename .glyphicon").removeClass("glyphicon-eye-open").addClass("glyphicon-eye-close");
        }
    });

    $("body").on("click", "#reMaTriggerBuildingTypeAlias", function() {
        if($("#reMaBuildingTypeAlias").hasClass("hidden")) {
            $("#reMaBuildingTypeAlias").removeClass("hidden");
            $("#reMaTriggerBuildingTypeAlias .glyphicon").removeClass("glyphicon-eye-close").addClass("glyphicon-eye-open");
        } else {
            $("#reMaBuildingTypeAlias").addClass("hidden");
            $("#reMaTriggerBuildingTypeAlias .glyphicon").removeClass("glyphicon-eye-open").addClass("glyphicon-eye-close");
        }
    });

    $("body").on("click", "#reMaTriggerBuildingAlias", function() {
        if($("#reMaBuildingAlias").hasClass("hidden")) {
            $("#reMaBuildingAlias").removeClass("hidden");
            $("#reMaTriggerBuildingAlias .glyphicon").removeClass("glyphicon-eye-close").addClass("glyphicon-eye-open");
        } else {
            $("#reMaBuildingAlias").addClass("hidden");
            $("#reMaTriggerBuildingAlias .glyphicon").removeClass("glyphicon-eye-open").addClass("glyphicon-eye-close");
        }
    });

    $("body").on("click", "#reMaRenameField .placeholder", function() {
        if(!$("#reMaRenameTextarea").val().includes($(this).text())) {
            $("#reMaRenameTextarea").val($("#reMaRenameTextarea").val() + $(this).text());
        }
        $("#reMaRenameTextarea").focus();
    });

    $("body").on("click", "#reMaVeTypes", function() {
        buildingAndVehicleTypeTable(aVehicleTypesNew, "vehicle_types");
    });

    $("body").on("click", "#reMaBuTypes", function() {
        buildingAndVehicleTypeTable(buildingTypes, "building_types");
    });

    $("body").on("click", "#reMaSelBuType", function() {
        if(!isNaN(+$("#reMaSelBuType").val())) {
            $("#reMaModalBody").html("<center>wird generiert ...</center>");
            buildingTable($("#reMaSelBuType").val(), "buildings");
        }
    });

    $("body").on("click", "#reMaModalBody span", async function() {
        var $this = $(this);
        var lat = $this.attr("lat");
        var lon = $this.attr("lon");
        await $.getJSON("https://nominatim.openstreetmap.org/reverse?format=json&lat="+lat+"&lon="+lon+"&zoom=18&addressdetails=1", function(data) {
            $this.text(data.address.county ? data.address.county : (data.address.city ? data.address.city : (data.address.town ? data.address.town : data.address.state)));
        });
        $this.css({"cursor":"default"});
    });

    $("body").on("click", "#reMaSave", function() {
        saveToLocalStorage($(this).attr("save_type"));
    });

    $("body").on("click", "#renameManagement", async function() {
        await getConfig();
        if(!isNaN(+$("#reMaSelBuType").val())) {
            $("#reMaModalBody").html("<center>wird generiert ...</center>");
            buildingTable($("#reMaSelBuType").val(), "buildings");
        } else {
            $("#reMaModalBody").html("");
            $("#reMaSave").attr("save_type", "");
        }
    });

    $("body").on("click", "#reMaZeroBefore", async function() {
        if($("#reMaZeroBefore")[0].checked) {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].zero_before = true;
            await saveInNotes();
        } else {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].zero_before = false;
            await saveInNotes();
        }
    });

    $("body").on("click", "#reMaCountyAlias1", async function() {
        if($("#reMaCountyAlias1")[0].checked) {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].county = true;
            $("#reMaBuildingAliasOne").val(config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_one ? config.buildings[buildingId].alias_one : buildingCounty);
            await saveInNotes();
        } else {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].county = false;
            $("#reMaBuildingAliasOne").val(config.buildings && config.buildings[buildingId] && config.buildings[buildingId].alias_one ? config.buildings[buildingId].alias_one : "");
            await saveInNotes();
        }
    });

    $("body").on("click", "#reMaNoKnown", async function() {
        if($("#reMaNoKnown")[0].checked) {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].known_vehicles = true;
            await saveInNotes();
        } else {
            if(!config.building_types) config.building_types = {};
            if(!config.building_types[buildingType]) config.building_types[buildingType] = {};
            config.building_types[buildingType].known_vehicles = false;
            await saveInNotes();
        }
    });

    $("body").on("click", "#reMaBuFields", function() {
        var modalContent = `<table class="table">
                              <thead>
                                <tr>
                                  <th class="col-1">Wachentyp</th>
                                  <th class="col">Rename-Field</th>
                                </tr>
                              </thead>
                              <tbody>`;

        for(var i in buildingTypes) {
            var e = buildingTypes[i];
            modalContent += `<tr>
                               <td class="col-1">${e.name}</td>
                               <td class="col">
                                 <div class="btn-group" style="display:flex">
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Fahrzeugtyp-Alias 1}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Fahrzeugtyp-Alias 2}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Wachentyp-Alias 1}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Wachentyp-Alias 2}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Wachen-Alias 1}</a>
                                 </div>
                                 <div class="btn-group" style="display:flex">
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Wachen-Alias 2}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Wachenname}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Zähler}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{röm. Ziffer}</a>
                                   <a class="btn btn-info btn-xs plchldrDispatch" style="flex:1" building_type="${e.id}">{Buchstabe}</a>
                                 </div>
                                 <input type="text" class="form-control" id="reMaRenameTextarea_${e.id}" value="${config.building_types && config.building_types[e.id] && config.building_types[e.id].textarea ? config.building_types[e.id].textarea : ""}">
                                 <div class="form-check">
                                   <input type="checkbox" class="form-check-input" building_type="${e.id}" ${config.building_types && config.building_types[e.id] && config.building_types[e.id].zero_before ? "checked" : ""}>
                                   <label class="form-check-label" for="reMaZeroBefore">0 vor einstelligem Zähler</label>
                                 </div>`;
        }
        modalContent += "</tbody></table>";
        $("#reMaSave").attr("save_type", "rename_fields");
        $("#reMaModalBody").html(modalContent);
    });

    $("body").on("click", "#reMaModalBody .form-check-input", async function() {
        var $this = $(this);
        var buildingType = $this.attr("building_type");
        if(!config.building_types) config.building_types = {};
        if(!config.building_types[buildingType]) config.building_types[buildingType] = {}
        config.building_types[buildingType].zero_before = $this[0].checked;
        await saveInNotes();
    });

    $("body").on("click", ".plchldrDispatch", function() {
        var $this = $(this);
        var buildingType = $this.attr("building_type");
        var placeholder = $this.text();

        if(!$("#reMaRenameTextarea_"+buildingType).val().includes(placeholder)) {
            $("#reMaRenameTextarea_"+buildingType).val($("#reMaRenameTextarea_"+buildingType).val() + placeholder);
        }
        $("#reMaRenameTextarea_"+buildingType).focus();
    });

})();