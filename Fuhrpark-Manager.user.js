// ==UserScript==
// @name         Fuhrpark-Manager
// @version      1.6.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    var buttonOnRadio = true; //true: shows button on radio-panel; false: shows button on header

    if(buttonOnRadio) $('#radio_panel_heading').after(`<a id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" ><button type="button" class="btn btn-default btn-xs">Fuhrpark-Manager</button></a>`);
    else $('#menu_profile').parent().before(`<li><a style="cursor: pointer" id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" ><div class="glyphicon glyphicon-list-alt"></div></a></li>`);

    $("head").append(`<style>
.modal {
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
}
</style>`);

    $("body")
        .prepend(`<div class="modal fade"
                     id="tableStatus"
                     tabindex="-1"
                     role="dialog"
                     aria-labelledby="exampleModalLabel"
                     aria-hidden="true"
                >
                    <div class="modal-dialog modal-lg" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                             <div class="pull-left">
                              <h5>Fuhrpark-Manager</h5>
                             </div><br>
                             <button type="button"
                                        class="close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button><br>
                              <div class="pull-left">
                               <div class="btn-group btn-group-xs" role="group" aria-label="Small button group">
                                <button id="fms1" class="btn btn-primary btn-xs">Status 1</button>
                                <button id="fms2" class="btn btn-primary btn-xs">Status 2</button>
                                <button id="fms3" class="btn btn-primary btn-xs">Status 3</button>
                                <button id="fms4" class="btn btn-primary btn-xs">Status 4</button>
                                <button id="fms5" class="btn btn-primary btn-xs">Status 5</button>
                                <button id="fms6" class="btn btn-primary btn-xs">Status 6</button>
                                <button id="fms7" class="btn btn-primary btn-xs">Status 7</button>
                                <button id="fms9" class="btn btn-primary btn-xs">Status 9</button>
                                <button id="complete" class="btn btn-info btn-xs">alle Fahrzeuge</button>
                                <button id="player" class="btn btn-warning btn-xs">Spielerinfos</button>
                               </div>
                             </div><br><br>
                             <div class="pull-left">
                              <select id="sortBy" class="custom-select">
                               <option selected>Sortierung wählen</option>
                              </select><br>
                              <select id="filterType" class="custom-select">
                               <option selected>alle Typen</option>
                              </select>
                             </div>
                             <div class="pull-right">
                              <a id="filterFw" class="label label-success">Feuerwehr</a>
                              <a id="filterRd" class="label label-success">Rettungsdienst</a>
                              <a id="filterThw" class="label label-success">THW</a>
                              <a id="filterPol" class="label label-success">Polizei</a>
                              <a id="filterWr" class="label label-success">Wasserrettung</a>
                              <a id="filterHeli" class="label label-success">Hubschrauber</a>
                              <a id="filterBp" class="label label-success">BePo/Pol-Sonder</a>
                              <a id="filterSeg" class="label label-success">SEG/RHS</a>
                             </div><br><br>
                                <h5 class="modal-title" id="tableStatusLabel">
                                </h5>
                            </div>
                            <div class="modal-body" id="tableStatusBody"></div>
                            <div class="modal-footer">
                             <div class="pull-left">
                                v ${GM_info.script.version}
                             </div>
                                <button type="button"
                                        id="tableStatusCloseButton"
                                        class="btn btn-danger"
                                        data-dismiss="modal"
                                >
                                    Schließen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>`);

    var sortOptions = ['Status','Name-aufsteigend','Name-absteigend','Wache-aufsteigend','Wache-absteigend','Typ-aufsteigend','Typ-absteigend'];
    for(var i = 0; i < sortOptions.length; i++){
        $('#sortBy').append(`<option value="${sortOptions[i]}">${sortOptions[i]}</option>`);
    }

    var filterFwVehicles = true; //buildingTypeIds: 0, 18
    var filterRdVehicles = true; //buildingTypeIds: 2, 20
    var filterThwVehicles = true; //buildingTypeIds: 9
    var filterPolVehicles = true; //buildingTypeIds: 6, 19
    var filterWrVehicles = true; //buildingTypeIds: 15
    var filterHeliVehicles = true; //buildingTypeIds: 5, 13
    var filterBpVehicles = true; //buildingTypeIds: 11, 17
    var filterSegVehicles = true; //buildingTypeIds: 12, 21
    var filterVehicleType = parseInt($('#filterType').val());
    var filterOwnClassType = $('#filterType').find(':selected').data('vehicle');
    var statusCount = 0;
    var vehicleDatabase = {};
    var buildingsDatabase = {};
    var getBuildingTypeId = {};
    var getBuildingName = {};
    var vehicleDatabaseFms = {};
    var creditsDatabase = {};
    var dropdownOwnClass = [];

    $.getJSON('https://lss-manager.de/api/cars.php?lang=de_DE').done(function(data){
        var mapObj = {"ï¿½": "Ö", "Ã¶": "ö", "Ã¼": "ü", "Ã\u0096": "Ö"};
        $.each(data, (k,v) => {
            v.name = v.name.replace(new RegExp(Object.keys(mapObj).join("|"),"gi"), matched => mapObj[matched])
        });
        vehicleDatabase = data;
    });

    $.getJSON('/api/vehicles').done(function(data){
        $.each(data, function(key, item){
            if(item.vehicle_type_caption) dropdownOwnClass.push({"ownClass": item.vehicle_type_caption});
        });
    });

    setTimeout(function(){
        var dropdownDatabase = [];
        $.each(vehicleDatabase, function(key, item){
            dropdownDatabase.push({"typeId": key, "name": item.name});
        });
        dropdownDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
        for(let i = 0; i < dropdownDatabase.length; i++){
            $('#filterType').append(`<option value="${dropdownDatabase[i].typeId}">${dropdownDatabase[i].name}</option>`);
        }
        if(dropdownOwnClass.length > 0){
            if(dropdownOwnClass.length >= 2) dropdownOwnClass.sort((a, b) => a.ownClass.toUpperCase() > b.ownClass.toUpperCase() ? 1 : -1);
            for(let i = 0; i < dropdownOwnClass.length; i++){
                if(i > 0 && dropdownOwnClass[i].ownClass !== dropdownOwnClass[i - 1].ownClass){
                    $('#filterType').append(`<option value="-1" data-vehicle="${dropdownOwnClass[i].ownClass}">${dropdownOwnClass[i].ownClass}</option>`);
                }
                else if(i == 0) $('#filterType').append(`<option value="-1" data-vehicle="${dropdownOwnClass[i].ownClass}">${dropdownOwnClass[i].ownClass}</option>`);
            }
        }
    }, 2000);

    function loadApi(){

        $.getJSON('/api/buildings').done(function(data){
            buildingsDatabase = data;
            $.each(data, function(key, item){
                getBuildingTypeId[item.id] = item.building_type;
                getBuildingName[item.id] = item.caption;
            });
        });

        $.getJSON('/api/vehicles').done(function(data){
            vehicleDatabaseFms = data;
        });

        $.getJSON('/api/credits').done(function(data){
            creditsDatabase = data;
        });

    }

    function createTable(statusIndex) {

        var tableDatabase = [];

        $.each(vehicleDatabaseFms, function(key, item){
            var pushContent = {"status": item.fms_real, "id": item.id, "name": item.caption, "typeId": item.vehicle_type, "buildingId": item.building_id, "ownClass": item.vehicle_type_caption};
            if(isNaN(filterVehicleType)){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
            else if(filterVehicleType == -1 && filterOwnClassType == item.vehicle_type_caption){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
            else if(filterVehicleType == item.vehicle_type && !item.vehicle_type_caption){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
        });

        function filterDatabase(typeId1, typeId2){
            for(let i = tableDatabase.length - 1; i >= 0; i--){
                if(getBuildingTypeId[tableDatabase[i].buildingId] == typeId1 || getBuildingTypeId[tableDatabase[i].buildingId] == typeId2) tableDatabase.splice(i,1);
            }
        }

        if(!filterFwVehicles) filterDatabase("0", "18");
        if(!filterRdVehicles) filterDatabase("2", "20");
        if(!filterThwVehicles) filterDatabase("9", "9");
        if(!filterPolVehicles) filterDatabase("6", "19");
        if(!filterWrVehicles) filterDatabase("15", "15");
        if(!filterHeliVehicles) filterDatabase("5", "13");
        if(!filterBpVehicles) filterDatabase("11", "17");
        if(!filterSegVehicles) filterDatabase("12", "21");

        //setTimeout(function(){
            switch($('#sortBy').val()){
                case "":
                    break;
                case "Status":
                    tableDatabase.sort((a, b) => a.status > b.status ? 1 : -1);
                    break;
                case "Name-aufsteigend":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
                    break;
                case "Name-absteigend":
                    tableDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? -1 : 1);
                    break;
                case "Wache-aufsteigend":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? 1 : -1);
                    break;
                case "Wache-absteigend":
                    tableDatabase.sort((a, b) => getBuildingName[a.buildingId].toUpperCase() > getBuildingName[b.buildingId].toUpperCase() ? -1 : 1);
                    break;
                case "Typ-aufsteigend":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? 1 : -1);
                    break;
                case "Typ-absteigend":
                    tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : vehicleDatabase[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : vehicleDatabase[b.typeId].name.toUpperCase()) ? -1 : 1);
                    break;
            }
            let intoLabel =
                `<div class="pull-right">Status ${statusIndex}: ${tableDatabase.length.toLocaleString()} Fahrzeuge</div>`;
            let intoTable =
                `<table class="table">
                 <thead>
                 <tr>
                 <th class="col-1">FMS</th>
                 <th class="col">Kennung</th>
                 <th class="col">Fahrzeugtyp</th>
                 <th class="col"> </th>
                 <th class="col">Wache</th>
                 </tr>
                 </thead>
                 <tbody>`;

            for(let i = 0; i < tableDatabase.length; i++){
                intoTable +=
                    `<tr>
                     <td class="col-1"><span style="cursor: pointer" class="building_list_fms building_list_fms_${tableDatabase[i].status}" id="tableFms_${tableDatabase[i].id}">${tableDatabase[i].status}</span>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}">${tableDatabase[i].name}</a></td>
                     <td class="col">${!tableDatabase[i].ownClass ? vehicleDatabase[tableDatabase[i].typeId].name : tableDatabase[i].ownClass}</td>
                     <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/zuweisung"><button type="button" class="btn btn-default btn-xs">Personalzuweisung</button></a>
                      <a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}/edit"><button type="button" class="btn btn-default btn-xs"><div class="glyphicon glyphicon-pencil"></div></button></a></td>
                     <td class="col"><a class="lightbox-open" href="/buildings/${tableDatabase[i].buildingId}">${getBuildingName[tableDatabase[i].buildingId]}</a></td>
                     </tr>`;
            }

            intoTable += `</tbody>
                          </table>`;

            $('#tableStatusLabel').html(intoLabel);
            $('#tableStatusBody').html(intoTable);
            tableDatabase.length = 0;
        //}, 2000);
    }

    function playerInfos(){

        var fireBuildings = 0;
        var fireBuildingsSmall = 0;
        var rescueBuildings = 0;
        var rescueBuildingsSmall = 0;
        var policeBuildings = 0;
        var policeBuildingsSmall = 0;
        var thwBuildings = 0;
        var waterRescueBuildings = 0;
        var rescueDogBuildings = 0;
        var bePoBuildings = 0;
        var polSonderBuildings = 0;
        var rescueHelicopterBuildings = 0;
        var policeHelicopterBuildings = 0;
        var hospitalBuildings = 0;
        var segBuildings = 0;
        var dispatchCenterBuildings = 0;
        var stagingArea = 0;
        var fireSchoolBuildings = 0;
        var rescueSchoolBuildings = 0;
        var thwSchoolBuildings = 0;
        var polSchoolBuildings = 0;
        var naw = 0;
        var grtw = 0;
        var rth = 0;
        var polHeli = 0;
        var buildBig = 0;
        var buildIndustry = 0;
        var buildAirport = 0;
        var buildRescue = 0;
        var buildLeader = 0;
        var buildSanD = 0;
        var buildSegWr = 0;
        var buildFwWr = 0;
        var buildSegDogs = 0;
        var buildAbBig = 0;
        var buildAbSmall = 0;
        var buildSecondDivision = 0;
        var buildThirdDivision = 0;
        var buildWaterthrower = 0;
        var buildMobilePrison = 0;
        var buildBpFirstSek = 0;
        var buildBpSecondSek = 0;
        var buildBpFirstMek = 0;
        var buildBpSecondMek = 0;
        var buildPolSonderFirstSek = 0;
        var buildPolSonderSecondSek = 0;
        var buildPolSonderFirstMek = 0;
        var buildPolSonderSecondMek = 0;
        var buildFirstTzBg = 0;
        var buildFirstTzZug = 0;
        var buildFgrR = 0;
        var buildFgrW = 0;
        var buildSecondTzGrund = 0;
        var buildSecondTzBg = 0;
        var buildSecondTzZug = 0;
        var buildFgrO = 0;
        var buildIna = 0;
        var buildAch = 0;
        var buildGyn = 0;
        var buildUro = 0;
        var buildUch = 0;
        var buildNrl = 0;
        var buildNch = 0;
        var buildKar = 0;
        var buildKch = 0;
        var activeIndustry = 0;
        var activeAirport = 0;
        var activeRescue = 0;
        var activeLeader = 0;
        var activeSanD = 0;
        var activeSegWr = 0;
        var activeFwWr = 0;
        var activeSegDogs = 0;
        var activeSecondDivision = 0;
        var activeThirdDivision = 0;
        var activeWaterthrower = 0;
        var activeMobilePrison = 0;
        var activeBpFirstSek = 0;
        var activeBpSecondSek = 0;
        var activeBpFirstMek = 0;
        var activeBpSecondMek = 0;
        var activePolSonderFirstSek = 0;
        var activePolSonderSecondSek = 0;
        var activePolSonderFirstMek = 0;
        var activePolSonderSecondMek = 0;
        var activeFirstTzBg = 0;
        var activeFirstTzZug = 0;
        var activeFgrR = 0;
        var activeFgrW = 0;
        var activeSecondTzGrund = 0;
        var activeSecondTzBg = 0;
        var activeSecondTzZug = 0;
        var activeFgrO = 0;

        $.each(vehicleDatabaseFms, function(key, item){
            switch(item.vehicle_type){
                case 31: rth ++;
                    break;
                case 61: polHeli ++;
                    break;
                case 73: grtw ++;
                    break;
                case 74: naw ++;
                    break;
            }
        });

        $.each(buildingsDatabase, function(key, item){
            switch(item.building_type){
                case 0: fireBuildings ++;
                    break;
                case 1: fireSchoolBuildings ++;
                    break;
                case 2: rescueBuildings ++;
                    break;
                case 3: rescueSchoolBuildings ++;
                    break;
                case 4: hospitalBuildings ++;
                    break;
                case 5: rescueHelicopterBuildings ++;
                    break;
                case 6: policeBuildings ++;
                    break;
                case 7: dispatchCenterBuildings ++;
                    break;
                case 8: polSchoolBuildings ++;
                    break;
                case 9: thwBuildings ++;
                    break;
                case 10: thwSchoolBuildings ++;
                    break;
                case 11: bePoBuildings ++;
                    break;
                case 12: segBuildings ++;
                    break;
                case 13: policeHelicopterBuildings ++;
                    break;
                case 14: stagingArea ++;
                    break;
                case 15: waterRescueBuildings ++;
                    break;
                case 16:
                    break;
                case 17: polSonderBuildings ++;
                    break;
                case 18: fireBuildingsSmall ++;
                    break;
                case 19: policeBuildingsSmall ++;
                    break;
                case 20: rescueBuildingsSmall ++;
                    break;
                case 21: rescueDogBuildings ++;
                    break;
            }
            if(item.extensions.length > 0){
                for(let i = 0; i < item.extensions.length; i ++){
                    if(item.extensions[i].available){
                        switch(item.extensions[i].caption){
                            case "Großwache": buildBig ++;
                                break;
                            case "Rettungsdienst-Erweiterung": buildRescue ++;
                                break;
                            case "Werkfeuerwehr": buildIndustry ++;
                                break;
                            case "Flughafen-Erweiterung": buildAirport ++;
                                break;
                            case "Führung": buildLeader ++;
                                break;
                            case "Sanitätsdienst": buildSanD ++;
                                break;
                            case "Wasserrettungs-Erweiterung":
                                if(item.building_type == 0) buildFwWr ++;
                                else if(item.building_type == 12) buildSegWr ++;
                                break;
                            case "Rettungshundestaffel": buildSegDogs ++;
                                break;
                            case "Abrollbehälter-Stellplatz":
                                if(item.building_type == 0) buildAbBig ++;
                                else if(item.building_type == 18) buildAbSmall ++;
                                break;
                            case "2. Zug der 1. Hundertschaft": buildSecondDivision ++;
                                break;
                            case "3. Zug der 1. Hundertschaft": buildThirdDivision ++;
                                break;
                            case "Sonderfahrzeug: Gefangenenkraftwagen": buildMobilePrison ++;
                                break;
                            case "Technischer Zug: Wasserwerfer": buildWaterthrower ++;
                                break;
                            case "SEK: 1. Zug":
                                if(item.building_type == 11) buildBpFirstSek ++;
                                else if(item.building_type == 17) buildPolSonderFirstSek ++;
                                break;
                            case "SEK: 2. Zug":
                                if(item.building_type == 11) buildBpSecondSek ++;
                                else if(item.building_type == 17) buildPolSonderSecondSek ++;
                                break;
                            case "MEK: 1. Zug":
                                if(item.building_type == 11) buildBpFirstMek ++;
                                else if(item.building_type == 17) buildPolSonderFirstMek ++;
                                break;
                            case "MEK: 2. Zug":
                                if(item.building_type == 11) buildBpSecondMek ++;
                                else if(item.building_type == 17) buildPolSonderSecondMek ++;
                                break;
                            case "1. Technischer Zug: Bergungsgruppe 2": buildFirstTzBg ++;
                                break;
                            case "1. Technischer Zug: Zugtrupp": buildFirstTzZug ++;
                                break;
                            case "Fachgruppe Räumen": buildFgrR ++;
                                break;
                            case "Fachgruppe Wassergefahren": buildFgrW ++;
                                break;
                            case "2. Technischer Zug - Grundvorraussetzungen": buildSecondTzGrund ++;
                                break;
                            case "2. Technischer Zug: Bergungsgruppe 2": buildSecondTzBg ++;
                                break;
                            case "2. Technischer Zug: Zugtrupp": buildSecondTzZug ++;
                                break;
                            case "Fachgruppe Ortung": buildFgrO ++;
                                break;
                            case "Allgemeine Innere": buildIna ++;
                                break;
                            case "Allgemeine Chirurgie": buildAch ++;
                                break;
                            case "Gynäkologie": buildGyn ++;
                                break;
                            case "Urologie": buildUro ++;
                                break;
                            case "Unfallchirurgie": buildUch ++;
                                break;
                            case "Neurologie": buildNrl ++;
                                break;
                            case "Neurochirurgie": buildNch ++;
                                break;
                            case "Kardiologie": buildKar ++;
                                break;
                            case "Kardiochirurgie": buildKch ++;
                                break;
                        }
                    }
                    if(item.extensions[i].enabled && item.extensions[i].available){
                        switch(item.extensions[i].caption){
                            case "Rettungsdienst-Erweiterung": activeRescue ++;
                                break;
                            case "Werkfeuerwehr": activeIndustry ++;
                                break;
                            case "Flughafen-Erweiterung": activeAirport ++;
                                break;
                            case "Führung": activeLeader ++;
                                break;
                            case "Sanitätsdienst": activeSanD ++;
                                break;
                            case "Wasserrettungs-Erweiterung":
                                if(item.building_type == 0) activeFwWr ++;
                                else if(item.building_type == 12) activeSegWr ++;
                                break;
                            case "Rettungshundestaffel": activeSegDogs ++;
                                break;
                            case "2. Zug der 1. Hundertschaft": activeSecondDivision ++;
                                break;
                            case "3. Zug der 1. Hundertschaft": activeThirdDivision ++;
                                break;
                            case "Sonderfahrzeug: Gefangenenkraftwagen": activeMobilePrison ++;
                                break;
                            case "Technischer Zug: Wasserwerfer": activeWaterthrower ++;
                                break;
                            case "SEK: 1. Zug":
                                if(item.building_type == 11) activeBpFirstSek ++;
                                else if(item.building_type == 17) activePolSonderFirstSek ++;
                                break;
                            case "SEK: 2. Zug":
                                if(item.building_type == 11) activeBpSecondSek ++;
                                else if(item.building_type == 17) activePolSonderSecondSek ++;
                                break;
                            case "MEK: 1. Zug":
                                if(item.building_type == 11) activeBpFirstMek ++;
                                else if(item.building_type == 17) activePolSonderFirstMek ++;
                                break;
                            case "MEK: 2. Zug":
                                if(item.building_type == 11) activeBpSecondMek ++;
                                else if(item.building_type == 17) activePolSonderSecondMek ++;
                                break;
                            case "1. Technischer Zug: Bergungsgruppe 2": activeFirstTzBg ++;
                                break;
                            case "1. Technischer Zug: Zugtrupp": activeFirstTzZug ++;
                                break;
                            case "Fachgruppe Räumen": activeFgrR ++;
                                break;
                            case "Fachgruppe Wassergefahren": activeFgrW ++;
                                break;
                            case "2. Technischer Zug - Grundvorraussetzungen": activeSecondTzGrund ++;
                                break;
                            case "2. Technischer Zug: Bergungsgruppe 2": activeSecondTzBg ++;
                                break;
                            case "2. Technischer Zug: Zugtrupp": activeSecondTzZug ++;
                                break;
                            case "Fachgruppe Ortung": activeFgrO ++;
                                break;
                        }
                    }
                }
            }
        });

        $('#tableStatusLabel').html(`<div class="pull-right">Statistik ${creditsDatabase.user_name} (${creditsDatabase.user_id})<span style="margin-left:4em"></span>
                                     Toplist-Platz: ${creditsDatabase.user_toplist_position.toLocaleString()}</div>`);

        let userInfos =
                `<table class="table">
                 <thead>
                 <tr>
                 <th class="col">Bezeichnung<br>&nbsp;</th>
                 <th class="col-1">Anzahl<br>ist / max</th>
                 </tr>
                 </thead>
                 <tbody>`;

        function infoContentOneValue(name, value){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1">${value.toLocaleString()}</td>
                          </tr>`;
        }

        function infoContentMax(name, valueNow, valueMax){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1">${valueNow.toLocaleString()} / ${valueMax.toLocaleString()}</td>
                          </tr>`;
        }

        infoContentOneValue("Fahrzeuge", vehicleDatabaseFms.length);

        if(user_premium ? (rescueBuildings + rescueBuildingsSmall + activeRescue) > 15 : (rescueBuildings + rescueBuildingsSmall + activeRescue) > 20){
            infoContentMax("Großraumrettungswagen (GRTW)", grtw, user_premium ? Math.floor((rescueBuildings + rescueBuildingsSmall + activeRescue) / 15) : Math.floor((rescueBuildings + rescueBuildingsSmall + activeRescue) / 20));
        }

        if((rescueBuildings + rescueBuildingsSmall + activeRescue) > 0) infoContentMax("Notarztwagen (NAW)", naw, (rescueBuildings + rescueBuildingsSmall + activeRescue));

        infoContentMax("Rettungshubschrauber (RTH)", rth, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);

        infoContentMax("Polizeihubschrauber", polHeli, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);

        infoContentOneValue("Gebäude", buildingsDatabase.length);

        if(fireBuildings > 0) infoContentOneValue("Feuerwachen", fireBuildings);
        infoContentMax('Feuerwachen mit Ausbau "Großwache"', buildBig, Math.floor((fireBuildings + fireBuildingsSmall) / 10));
        if(buildRescue > 0) infoContentMax('Feuerwachen mit Ausbau "Rettungsdienst-Erweiterung"', activeRescue, buildRescue);
        if(buildFwWr > 0) infoContentMax('Feuerwachen mit Ausbau "Wasserrettungs-Erweiterung"', activeFwWr, buildFwWr);
        if(buildAirport > 0) infoContentMax('Feuerwachen mit Ausbau "Flughafen-Erweiterung"', activeAirport, buildAirport);
        if(buildIndustry > 0) infoContentMax('Feuerwachen mit Ausbau "Werkfeuerwehr"', activeIndustry, buildIndustry);
        if(buildAbBig > 0) infoContentOneValue("AB-Stellplätze an Feuerwachen", buildAbBig);

        if(fireBuildingsSmall > 0) infoContentOneValue("Feuerwachen (klein)", fireBuildingsSmall);
        if(buildAbSmall > 0) infoContentOneValue("AB-Stellplätze an Feuerwachen (klein)", buildAbSmall);

        if(rescueBuildings > 0) infoContentOneValue("Rettungswachen", rescueBuildings);

        if(rescueBuildingsSmall > 0) infoContentOneValue("Rettungswachen (klein)", rescueBuildingsSmall);

        if(segBuildings > 0) infoContentOneValue("Schnelleinsatzgruppen (SEG)", segBuildings);
        if(buildLeader > 0) infoContentMax('Schnelleinsatzgruppen (SEG) mit Ausbau "Führung"', activeLeader, buildLeader);
        if(buildSanD > 0) infoContentMax('Schnelleinsatzgruppen (SEG) mit Ausbau "Sanitätsdienst"', activeSanD, buildSanD);
        if(buildSegWr > 0) infoContentMax('Schnelleinsatzgruppen (SEG) mit Ausbau "Wasserrettungs-Erweiterung"', activeSegWr, buildSegWr);
        if(buildSegDogs > 0) infoContentMax('Schnelleinsatzgruppen (SEG) mit Ausbau "Rettungshundestaffel"', activeSegDogs, buildSegDogs);

        if(rescueHelicopterBuildings > 0) infoContentOneValue("Rettungshubschrauber-Stationen", rescueHelicopterBuildings);

        if(policeBuildings > 0) infoContentOneValue("Polizeiwachen", policeBuildings);

        if(policeBuildingsSmall > 0) infoContentOneValue("Polizeiwachen (klein)", policeBuildingsSmall);

        if(bePoBuildings > 0) infoContentOneValue("Bereitschaftspolizei", bePoBuildings);
        if(buildSecondDivision > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "2. Zug der 1. Hundertschaft"', activeSecondDivision, buildSecondDivision);
        if(buildThirdDivision > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "3. Zug der 1. Hundertschaft"', activeThirdDivision, buildThirdDivision);
        if(buildMobilePrison > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "Sonderfahrzeug: Gefangenenkraftwagen"', activeMobilePrison, buildMobilePrison);
        if(buildWaterthrower > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "Technischer Zug: Wasserwerfer"', activeWaterthrower, buildWaterthrower);
        if(buildBpFirstSek > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "SEK: 1. Zug"', activeBpFirstSek, buildBpFirstSek);
        if(buildBpSecondSek > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "SEK: 2. Zug"', activeBpSecondSek, buildBpSecondSek);
        if(buildBpFirstMek > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "MEK: 1. Zug"', activeBpFirstMek, buildBpFirstMek);
        if(buildBpSecondMek > 0) infoContentMax('Bereitschaftspolizei mit Ausbau "MEK: 2. Zug"', activeBpSecondMek, buildBpSecondMek);

        if(polSonderBuildings > 0) infoContentOneValue("Polizei-Sondereinheiten", polSonderBuildings);
        if(buildPolSonderFirstSek > 0) infoContentMax('Polizei-Sondereinheiten mit Ausbau "SEK: 1. Zug"', activePolSonderFirstSek, buildPolSonderFirstSek);
        if(buildPolSonderSecondSek > 0) infoContentMax('Polizei-Sondereinheiten mit Ausbau "SEK: 2. Zug"', activePolSonderSecondSek, buildPolSonderSecondSek);
        if(buildPolSonderFirstMek > 0) infoContentMax('Polizei-Sondereinheiten mit Ausbau "MEK: 1. Zug"', activePolSonderFirstMek, buildPolSonderFirstMek);
        if(buildPolSonderSecondMek > 0) infoContentMax('Polizei-Sondereinheiten mit Ausbau "MEK: 2. Zug"', activePolSonderSecondMek, buildPolSonderSecondMek);

        if(policeHelicopterBuildings > 0) infoContentOneValue("Polizeihubschrauber-Stationen", policeHelicopterBuildings);

        if(thwBuildings > 0) infoContentOneValue("THW Ortsverbände", thwBuildings);
        if(buildFirstTzBg > 0) infoContentMax('THW Ortsverbände mit Ausbau "1. Technischer Zug: Bergungsgruppe 2"', activeFirstTzBg, buildFirstTzBg);
        if(buildFirstTzZug > 0) infoContentMax('THW Ortsverbände mit Ausbau "1. Technischer Zug: Zugtrupp"', activeFirstTzZug, buildFirstTzZug);
        if(buildFgrR > 0) infoContentMax('THW Ortsverbände mit Ausbau "Fachgruppe Räumen"', activeFgrR, buildFgrR);
        if(buildFgrW > 0) infoContentMax('THW Ortsverbände mit Ausbau "Fachgruppe Wassergefahren"', activeFgrW, buildFgrW);
        if(buildSecondTzGrund > 0) infoContentMax('THW Ortsverbände mit Ausbau "2. Technischer Zug: Grundvoraussetzungen"', activeSecondTzGrund, buildSecondTzGrund);
        if(buildSecondTzBg > 0) infoContentMax('THW Ortsverbände mit Ausbau "2. Technischer Zug: Bergungsgruppe 2"', activeSecondTzBg, buildSecondTzBg);
        if(buildSecondTzZug > 0) infoContentMax('THW Ortsverbände mit Ausbau "2. Technischer Zug: Zugtrupp"', activeSecondTzZug, buildSecondTzZug);
        if(buildFgrO > 0) infoContentMax('THW Ortsverbände mit Ausbau "Fachgruppe Ortung"', activeFgrO, buildFgrO);

        if(waterRescueBuildings > 0) infoContentOneValue("Wasserrettungen", waterRescueBuildings);

        if(rescueDogBuildings > 0) infoContentOneValue("Rettungshundestaffeln", rescueDogBuildings);

        infoContentMax("Leitstellen", dispatchCenterBuildings, Math.ceil(buildingsDatabase.length / 25) > 0 ? Math.ceil(buildingsDatabase.length / 25) : 1);

        if(stagingArea > 0) infoContentOneValue("Bereitstellungsräume (BSR)", stagingArea);

        if(hospitalBuildings > 0){
            infoContentOneValue("Krankenhäuser", hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Allgemeine Innere"', buildIna, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Allgemeine Chirurgie"', buildAch, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Gynäkologie"', buildGyn, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Urologie"', buildUro, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Unfallchirurgie"', buildUch, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Neurologie"', buildNrl, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Neurochirurgie"', buildNch, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Kardiologie"', buildKar, hospitalBuildings);
            infoContentMax('Krankenhäuser mit Fachrichtung "Kardiochirurgie"', buildKch, hospitalBuildings);
        }

        if(fireSchoolBuildings > 0) infoContentOneValue("Feuerwehrschulen", fireSchoolBuildings);
        if(rescueSchoolBuildings > 0) infoContentOneValue("Rettungsdienstschulen", rescueSchoolBuildings);
        if(polSchoolBuildings > 0) infoContentOneValue("Polizeischulen", polSchoolBuildings);
        if(thwSchoolBuildings > 0) infoContentOneValue("THW Bundesschulen", thwSchoolBuildings);

        userInfos += `</tbody></table>`;

        $('#tableStatusBody').html(userInfos);
    }

    $("body").on("click", "#vehicleManagement", function(){
        $('#tableStatusLabel').html('');
        $('#tableStatusBody').html('');
        statusCount = 0;
        getBuildingTypeId.length = 0;
        getBuildingName.length = 0;
        loadApi();
    });

    $("body").on("click", "#sortBy", function(){
        if(statusCount != 0) createTable(statusCount);
        else {
            statusCount = "1 bis 9";
            createTable(statusCount);
        }
    });

    $("body").on("click", "#tableStatusBody span", function(){
        if($(this)[0].className == "building_list_fms building_list_fms_6"){
            $.get('/vehicles/' + $(this)[0].id.replace('tableFms_','') + '/set_fms/2');
            $(this).toggleClass("building_list_fms_6 building_list_fms_2");
            $(this).text("2");
        } else if($(this)[0].className == "building_list_fms building_list_fms_2"){
            $.get('/vehicles/' + $(this)[0].id.replace('tableFms_','') + '/set_fms/6');
            $(this).toggleClass("building_list_fms_6 building_list_fms_2");
            $(this).text("6");
        }
    });

    $("body").on("click", "#filterType", function(){
        if(statusCount == 0){
            filterVehicleType = parseInt($('#filterType').val());
            filterOwnClassType = $('#filterType').find(':selected').data('vehicle');
        }
        else {
            filterVehicleType = parseInt($('#filterType').val());
            filterOwnClassType = $('#filterType').find(':selected').data('vehicle');
            createTable(statusCount);
        }
    });

    $("body").on("click", "#filterFw", function(){
        if(filterFwVehicles) {
            if(statusCount != 0){
                filterFwVehicles = false;
                createTable(statusCount);
            }
            else filterFwVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterFwVehicles = true;
                createTable(statusCount);
            }
            else filterFwVehicles = true;
        }

        $('#filterFw').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterRd", function(){
        if(filterRdVehicles) {
            if(statusCount != 0){
                filterRdVehicles = false;
                createTable(statusCount);
            }
            else filterRdVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterRdVehicles = true;
                createTable(statusCount);
            }
            else filterRdVehicles = true;
        }

        $('#filterRd').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterThw", function(){
        if(filterThwVehicles) {
            if(statusCount != 0){
                filterThwVehicles = false;
                createTable(statusCount);
            }
            else filterThwVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterThwVehicles = true;
                createTable(statusCount);
            }
            else filterThwVehicles = true;
        }

        $('#filterThw').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterPol", function(){
        if(filterPolVehicles) {
            if(statusCount != 0){
                filterPolVehicles = false;
                createTable(statusCount);
            }
            else filterPolVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterPolVehicles = true;
                createTable(statusCount);
            }
            else filterPolVehicles = true;
        }

        $('#filterPol').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterWr", function(){
        if(filterWrVehicles) {
            if(statusCount != 0){
                filterWrVehicles = false;
                createTable(statusCount);
            }
            else filterWrVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterWrVehicles = true;
                createTable(statusCount);
            }
            else filterWrVehicles = true;
        }

        $('#filterWr').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterHeli", function(){
        if(filterHeliVehicles) {
            if(statusCount != 0){
                filterHeliVehicles = false;
                createTable(statusCount);
            }
            else filterHeliVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterHeliVehicles = true;
                createTable(statusCount);
            }
            else filterHeliVehicles = true;
        }

        $('#filterHeli').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterBp", function(){
        if(filterBpVehicles) {
            if(statusCount != 0){
                filterBpVehicles = false;
                createTable(statusCount);
            }
            else filterBpVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterBpVehicles = true;
                createTable(statusCount);
            }
            else filterBpVehicles = true;
        }

        $('#filterBp').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#filterSeg", function(){
        if(filterSegVehicles) {
            if(statusCount != 0){
                filterSegVehicles = false;
                createTable(statusCount);
            }
            else filterSegVehicles = false;
        }
        else {
            if(statusCount != 0) {
                filterSegVehicles = true;
                createTable(statusCount);
            }
            else filterSegVehicles = true;
        }

        $('#filterSeg').toggleClass("label-success label-danger");
    });

    $("body").on("click", "#player", function(){
        playerInfos();
    });

    $("body").on("click", "#complete", function(){
        statusCount = "1 bis 9";
        createTable(statusCount);
    });

    $("body").on("click", "#fms1", function(){
        statusCount = 1;
        createTable(statusCount);
    });

    $("body").on("click", "#fms2", function(){
        statusCount = 2;
        createTable(statusCount);
    });

    $("body").on("click", "#fms3", function(){
        statusCount = 3;
        createTable(statusCount);
    });

    $("body").on("click", "#fms4", function(){
        statusCount = 4;
        createTable(statusCount);
    });

    $("body").on("click", "#fms5", function(){
        statusCount = 5;
        createTable(statusCount);
    });

    $("body").on("click", "#fms6", function(){
        statusCount = 6;
        createTable(statusCount);
    });

    $("body").on("click", "#fms7", function(){
        statusCount = 7;
        createTable(statusCount);
    });

    $("body").on("click", "#fms9", function(){
        statusCount = 9;
        createTable(statusCount);
    });

})();
