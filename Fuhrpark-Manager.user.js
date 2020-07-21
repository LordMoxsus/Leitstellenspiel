// ==UserScript==
// @name         Fuhrpark-Manager
// @version      2.4.1
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(async function() {
    'use strict';

    var buttonOnRadio = true; //true: zeigt Button im Funk-Fenster; false: zeigt Button im Header
    var showOnBuild = true; //true: zeigt Ausbauten im Ausbau; false: Ausbauten im Ausbau werden nicht gezeigt

    if(buttonOnRadio) $('#radio_panel_heading').after(`<a id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" class="btn btn-default btn-xs">Fuhrpark-Manager</a>`);
    else $('#menu_profile').parent().before(`<li><a style="cursor:pointer" id="vehicleManagement" data-toggle="modal" data-target="#tableStatus" ><div class="glyphicon glyphicon-list-alt"></div></a></li>`);

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
                             </div>
                             <button type="button"
                                        class="close"
                                        data-dismiss="modal"
                                        aria-label="Close"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                             <div class="pull-right" style="padding-top:2.5em">
                              <select id="filterDispatchCenter" class="custom-select" style="width:15em">
                               <option selected>wird geladen ...</option>
                              </select><br>
                              <select id="filterType" class="custom-select" style="width:15em">
                               <option selected>wird geladen ...</option>
                              </select><br>
                              <select id="sortBy" class="custom-select" style="width:15em">
                               <option selected>unsortiert</option>
                              </select>
                             </div>
                              <div class="pull-left">
                               <div class="btn-group btn-group-xs" role="group" aria-label="Small button group" style="display:flex">
                                <a id="fms1" class="btn btn-info btn-xs" style="flex:1">Status 1</a>
                                <a id="fms2" class="btn btn-info btn-xs" style="flex:1">Status 2</a>
                                <a id="fms3" class="btn btn-info btn-xs" style="flex:1">Status 3</a>
                                <a id="fms4" class="btn btn-info btn-xs" style="flex:1">Status 4</a>
                                <a id="fms5" class="btn btn-info btn-xs" style="flex:1">Status 5</a>
                                <a id="fms6" class="btn btn-info btn-xs" style="flex:1">Status 6</a>
                                <a id="fms7" class="btn btn-info btn-xs" style="flex:1">Status 7</a>
                                <a id="fms9" class="btn btn-info btn-xs" style="flex:1">Status 9</a>
                                <a id="complete" class="btn btn-warning btn-xs" style="flex:1">alle Fahrzeuge</a>
                                <a id="player" class="btn btn-default btn-xs" style="flex:1">Spielerinfos</a>
                               </div>
                               <div class="btn-group btn-group-xs" role="group" aria-label="Small button group" style="display:flex">
                                <a id="filterFw" class="btn btn-success btn-xs" style="flex:1">Feuerwehr</a>
                                <a id="filterRd" class="btn btn-success btn-xs" style="flex:1">Rettungsdienst</a>
                                <a id="filterThw" class="btn btn-success btn-xs" style="flex:1">THW</a>
                                <a id="filterPol" class="btn btn-success btn-xs" style="flex:1">Polizei</a>
                                <a id="filterWr" class="btn btn-success btn-xs" style="flex:1">Wasserrettung</a>
                                <a id="filterHeli" class="btn btn-success btn-xs" style="flex:1">Hubschrauber</a>
                                <a id="filterBp" class="btn btn-success btn-xs" style="flex:1">BePo/Pol-Sonder</a>
                                <a id="filterSeg" class="btn btn-success btn-xs" style="flex:1">SEG/RHS</a>
                               </div>
                             </div>
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

    var aVehicleTypes = {};
    var aVehicles = {};
    var aBuildings = {};
    var aCredits = {};
    var options = {
        "filter":{
            "fire":{"status":true,"counter":0,"timer":null},
            "rescue":{"status":true,"counter":0,"timer":null},
            "thw":{"status":true,"counter":0,"timer":null},
            "police":{"status":true,"counter":0,"timer":null},
            "wr":{"status":true,"counter":0,"timer":null},
            "helicopter":{"status":true,"counter":0,"timer":null},
            "bepo":{"status":true,"counter":0,"timer":null},
            "seg":{"status":true,"counter":0,"timer":null},
            "delay":700
        },
        "dropdown":{
            "vehicles":{
                "ownClass":$('#filterType').find(':selected').data('vehicle'),
                "type":parseInt($('#filterType').val())
            },
            "dispatchCenter":{"id":parseInt($('#filterDispatchCenter').val())},
            "sort":['Status','Name-aufsteigend','Name-absteigend','Wache-aufsteigend','Wache-absteigend','Typ-aufsteigend','Typ-absteigend']
        },
        "status":{"count":0}
    };

    var database = {
        "buildings":{
            "get":{"typeId":{},"name":{},"onDispatchCenter":{}}
        }
    };

    for(var i = 0; i < options.dropdown.sort.length; i++){
        $('#sortBy').append(`<option value="${options.dropdown.sort[i]}">${options.dropdown.sort[i]}</option>`);
    }

    function getVehicles(){
        $.getJSON('/api/vehicles').done(function(data){
            aVehicles = data;
        });
    }

    async function refreshApi(){
        if(!localStorage.aVehicleTypes || JSON.parse(localStorage.aVehicleTypes).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON('https://lss-manager.de/api/cars.php?lang=de_DE').done(data => localStorage.setItem('aVehicleTypes', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        if(!localStorage.aBuildings || JSON.parse(localStorage.aBuildings).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON('/api/buildings').done(data => localStorage.setItem('aBuildings', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );
        if(!localStorage.aCredits || JSON.parse(localStorage.aCredits).lastUpdate < (new Date().getTime() - 5 * 1000 * 60)) await $.getJSON('/api/credits ').done(data => localStorage.setItem('aCredits', JSON.stringify({lastUpdate: new Date().getTime(), value: data})) );

        aVehicleTypes = JSON.parse(localStorage.aVehicleTypes).value;
        aBuildings = JSON.parse(localStorage.aBuildings).value;
        aCredits = JSON.parse(localStorage.aCredits).value;
    }

    await refreshApi();
    await getVehicles();

    setInterval(async function(){
        await getVehicles();
    }, 5 * 1000 * 60);

    let radioMessageOrig = radioMessage;
    radioMessage = e => {
        radioMessageOrig(e);
        if(e.user_id == user_id){
            for(let i in aVehicles){
                if(aVehicles[i].id == e.id){
                    aVehicles[i].fms_real = e.fms_real;
                    aVehicles[i].fms = e.fms;
                    break;
                }
            }
        }
    }

    function createDropdown(){

        var dropdown = {
            "dispatchCenter":`<option selected>alle Leitstellen</option>`,
            "vehicleTypes":`<option selected>alle Fahrzeugtypen</option>`,
            "database":{"class":[],"types":[],"dispatchCenter":[]}
        };
        var mapObj = {"ï¿½": "Ö", "Ã¶": "ö", "Ã¼": "ü", "Ã\u0096": "Ö"};
        $.each(aVehicleTypes, (k,v) => {
            v.name = v.name.replace(new RegExp(Object.keys(mapObj).join("|"),"gi"), matched => mapObj[matched])
        });
        $.each(aBuildings, function(key, item){
            database.buildings.get.typeId[item.id] = item.building_type;
            database.buildings.get.name[item.id] = item.caption;
            database.buildings.get.onDispatchCenter[item.id] = item.leitstelle_building_id;
            if(item.building_type == 7){
                dropdown.database.dispatchCenter.push({"id": item.id, "name": item.caption});
            }
        });
        $.each(aVehicleTypes, function(key, item){
            dropdown.database.types.push({"typeId": key, "name": item.name});
        });
        $.each(aVehicles, function(key, item){
            if(item.vehicle_type_caption) dropdown.database.class.push({"ownClass": item.vehicle_type_caption});
        });
        if(dropdown.database.dispatchCenter.length > 0){
            if(dropdown.database.dispatchCenter.length >= 2){
                dropdown.database.dispatchCenter.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
            }
            for(let i = 0; i < dropdown.database.dispatchCenter.length; i++){
                dropdown.dispatchCenter += `<option value="${dropdown.database.dispatchCenter[i].id}">${dropdown.database.dispatchCenter[i].name}</option>`;
            }
        }
        dropdown.database.types.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
        for(let i = 0; i < dropdown.database.types.length; i++){
            dropdown.vehicleTypes += `<option value="${dropdown.database.types[i].typeId}">${dropdown.database.types[i].name}</option>`;
        }
        if(dropdown.database.class.length > 0){
            if(dropdown.database.class.length >= 2) dropdown.database.class.sort((a, b) => a.ownClass.toUpperCase() > b.ownClass.toUpperCase() ? 1 : -1);
            for(let i = 0; i < dropdown.database.class.length; i++){
                if(i > 0 && dropdown.database.class[i].ownClass !== dropdown.database.class[i - 1].ownClass){
                    dropdown.vehicleTypes += `<option value="-1" data-vehicle="${dropdown.database.class[i].ownClass}">${dropdown.database.class[i].ownClass}</option>`;
                }
                else if(i == 0) dropdown.vehicleTypes += `<option value="-1" data-vehicle="${dropdown.database.class[i].ownClass}">${dropdown.database.class[i].ownClass}</option>`;
            }
        }
        $('#filterDispatchCenter').html(dropdown.dispatchCenter);
        $('#filterType').html(dropdown.vehicleTypes);
        options.dropdown.vehicles.type = parseInt($('#filterType').val());
        options.dropdown.vehicles.ownClass = $('#filterType').find(':selected').data('vehicle');
        options.dropdown.dispatchCenter.id = parseInt($('#filterDispatchCenter').val());
    }

    async function apiDropdown(){
        await refreshApi();
        createDropdown();
    }

    function createTable(statusIndex) {

        var tableDatabase = [];

        $.each(aVehicles, function(key, item){
            var pushContent = {"status": item.fms_real, "id": item.id, "name": item.caption, "typeId": item.vehicle_type, "buildingId": item.building_id, "ownClass": item.vehicle_type_caption};
            if(isNaN(statusIndex)){
                if(isNaN(options.dropdown.vehicles.type)) tableDatabase.push(pushContent);
                else if(options.dropdown.vehicles.type == -1 && options.dropdown.vehicles.ownClass == item.vehicle_type_caption) tableDatabase.push(pushContent);
                else if(options.dropdown.vehicles.type == item.vehicle_type && !item.vehicle_type_caption) tableDatabase.push(pushContent);
            }
            else if(statusIndex == item.fms_real){
                if(isNaN(options.dropdown.vehicles.type)) tableDatabase.push(pushContent);
                else if(options.dropdown.vehicles.type == -1 && options.dropdown.vehicles.ownClass == item.vehicle_type_caption) tableDatabase.push(pushContent);
                else if(options.dropdown.vehicles.type == item.vehicle_type && !item.vehicle_type_caption) tableDatabase.push(pushContent);
            }
        });

        if(!isNaN(options.dropdown.dispatchCenter.id)){
            for(let i = tableDatabase.length - 1; i >= 0; i--){
                if(options.dropdown.dispatchCenter.id !== database.buildings.get.onDispatchCenter[tableDatabase[i].buildingId]) tableDatabase.splice(i,1);
            }
        }

        function filterDatabase(typeId1, typeId2){
            for(let i = tableDatabase.length - 1; i >= 0; i--){
                if(database.buildings.get.typeId[tableDatabase[i].buildingId] == typeId1 || database.buildings.get.typeId[tableDatabase[i].buildingId] == typeId2) tableDatabase.splice(i,1);
            }
        }

        if(!options.filter.fire.status) filterDatabase("0", "18");
        if(!options.filter.rescue.status) filterDatabase("2", "20");
        if(!options.filter.thw.status) filterDatabase("9", "9");
        if(!options.filter.police.status) filterDatabase("6", "19");
        if(!options.filter.wr.status) filterDatabase("15", "15");
        if(!options.filter.helicopter.status) filterDatabase("5", "13");
        if(!options.filter.bepo.status) filterDatabase("11", "17");
        if(!options.filter.seg.status) filterDatabase("12", "21");

        switch($('#sortBy').val()){
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
                tableDatabase.sort((a, b) => database.buildings.get.name[a.buildingId].toUpperCase() > database.buildings.get.name[b.buildingId].toUpperCase() ? 1 : -1);
                break;
            case "Wache-absteigend":
                tableDatabase.sort((a, b) => database.buildings.get.name[a.buildingId].toUpperCase() > database.buildings.get.name[b.buildingId].toUpperCase() ? -1 : 1);
                break;
            case "Typ-aufsteigend":
                tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : aVehicleTypes[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : aVehicleTypes[b.typeId].name.toUpperCase()) ? 1 : -1);
                break;
            case "Typ-absteigend":
                tableDatabase.sort((a, b) => (a.ownClass ? a.ownClass.toUpperCase() : aVehicleTypes[a.typeId].name.toUpperCase()) > (b.ownClass ? b.ownClass.toUpperCase() : aVehicleTypes[b.typeId].name.toUpperCase()) ? -1 : 1);
                break;
        }

        let intoLabel =
            `<div class="pull-left">${isNaN(statusIndex) ? `keinen Statusfilter gesetzt` : `Status ${statusIndex}`}</div>
             <div class="pull-right" style="margin-right:3em">${tableDatabase.length.toLocaleString()} Fahrzeuge</div>`;
        let intoTable =
            `<table class="table">
             <thead>
             <tr>
             <th class="col-1">FMS</th>
             <th class="col">Kennung</th>
             <th class="col">Fahrzeugtyp</th>
             <th class="col-xs-3"></th>
             <th class="col">Wache</th>
             </tr>
             </thead>
             <tbody>`;

        for(let i = 0; i < tableDatabase.length; i++){
            intoTable +=
                `<tr>
                 <td class="col-1"><span style="cursor:${tableDatabase[i].status == 2 || tableDatabase[i].status == 6 ? `pointer` : `not-allowed`}" class="building_list_fms building_list_fms_${tableDatabase[i].status}" id="tableFms_${tableDatabase[i].id}">${tableDatabase[i].status}</span>
                 <td class="col"><a class="lightbox-open" href="/vehicles/${tableDatabase[i].id}">${tableDatabase[i].name}</a></td>
                 <td class="col">${!tableDatabase[i].ownClass ? aVehicleTypes[tableDatabase[i].typeId].name : tableDatabase[i].ownClass}</td>
                 <td class="col-xs-3 btn-group btn-group-xs" role="group" aria-label="Small button group">
                  <a class="lightbox-open btn btn-default btn-xs" style="text-decoration:none" href="/vehicles/${tableDatabase[i].id}/edit"><div class="glyphicon glyphicon-pencil"></div></a>
                  <a class="lightbox-open btn btn-default btn-xs" style="text-decoration:none" href="/vehicles/${tableDatabase[i].id}/zuweisung">Personalzuweisung</a>
                 </td>
                 <td class="col"><a class="lightbox-open" href="/buildings/${tableDatabase[i].buildingId}">${database.buildings.get.name[tableDatabase[i].buildingId]}</a></td>
                 </tr>`;
        }

        intoTable += `</tbody>
                      </table>`;

        $('#tableStatusLabel').html(intoLabel);
        $('#tableStatusBody').html(intoTable);
        tableDatabase.length = 0;
    }

    function playerInfos(){

        var infoBuildingsDatabase = aBuildings.slice(0);
        var vehicles = {"rth":0,"polHeli":0,"grtw":0,"naw":0,"onDispatchCenter":[]};
        var buildings ={
            "fire":{
                "normal":{
                    "count":0,
                    "big":{"build":0,"onBuild":0},
                    "rescue":{"build":0,"active":0,"onBuild":0},
                    "industry":{"build":0,"active":0,"onBuild":0},
                    "airport":{"build":0,"active":0,"onBuild":0},
                    "wr":{"build":0,"active":0,"onBuild":0},
                    "ab":{"build":0,"onBuild":0}
                },
                "small":{
                    "count":0,
                    "ab":{"build":0,"onBuild":0}
                },
            },
            "rescue":{"normal":0,"small":0},
            "police":{
                "normal":{
                    "count":0,
                    "cell":{"build":0,"onBuild":0}
                },
                "small":{
                    "count":0,
                    "cell":{"build":0,"onBuild":0}
                }
            },
            "seg":{
                "count":0,
                "leader":{"build":0,"active":0,"onBuild":0},
                "sanD":{"build":0,"active":0,"onBuild":0},
                "wr":{"build":0,"active":0,"onBuild":0},
                "dogs":{"build":0,"active":0,"onBuild":0}
            },
            "bepo":{
                "count":0,
                "division":{
                    "second":{"build":0,"active":0,"onBuild":0},
                    "third":{"build":0,"active":0,"onBuild":0},
                },
                "waterthrower":{"build":0,"active":0,"onBuild":0},
                "mobilePrison":{"build":0,"active":0,"onBuild":0},
                "sek":{
                    "first":{"build":0,"active":0,"onBuild":0},
                    "second":{"build":0,"active":0,"onBuild":0},
                },
                "mek":{
                    "first":{"build":0,"active":0,"onBuild":0},
                    "second":{"build":0,"active":0,"onBuild":0}
                }
            },
            "polSonder":{
                "count":0,
                "sek":{
                    "first":{"build":0,"active":0,"onBuild":0},
                    "second":{"build":0,"active":0,"onBuild":0},
                },
                "mek":{
                    "first":{"build":0,"active":0,"onBuild":0},
                    "second":{"build":0,"active":0,"onBuild":0}
                }
            },
            "wr":{"count":0,"active":0},
            "rescueDogs":{"count":0,"active":0},
            "helicopter":{
                "rescue":{"count":0,"active":0},
                "police":{"count":0,"active":0}
            },
            "thw":{
                "count":0,
                "firstTz":{
                    "bg":{"build":0,"active":0,"onBuild":0},
                    "zug":{"build":0,"active":0,"onBuild":0}
                },
                "secondTz":{
                    "grund":{"build":0,"active":0,"onBuild":0},
                    "bg":{"build":0,"active":0,"onBuild":0},
                    "zug":{"build":0,"active":0,"onBuild":0}
                },
                "fgrO":{"build":0,"active":0,"onBuild":0},
                "fgrR":{"build":0,"active":0,"onBuild":0},
                "fgrW":{"build":0,"active":0,"onBuild":0}
            },
            "school":{
                "fire":{
                    "count":0,
                    "rooms":{"build":0,"onBuild":0}
                },
                "rescue":{
                    "count":0,
                    "rooms":{"build":0,"onBuild":0}
                },
                "police":{
                    "count":0,
                    "rooms":{"build":0,"onBuild":0}
                },
                "thw":{
                    "count":0,
                    "rooms":{"build":0,"onBuild":0}
                },
            },
            "hospital":{
                "count":0,
                "beds":{"build":0,"onBuild":0},
                "extension":{
                    "ina":{"build":0,"onBuild":0},
                    "ach":{"build":0,"onBuild":0},
                    "gyn":{"build":0,"onBuild":0},
                    "uro":{"build":0,"onBuild":0},
                    "uch":{"build":0,"onBuild":0},
                    "nrl":{"build":0,"onBuild":0},
                    "nch":{"build":0,"onBuild":0},
                    "kar":{"build":0,"onBuild":0},
                    "kch":{"build":0,"onBuild":0}
                },
            },
            "dispatchCenter":0,
            "stagingArea":0
        };
        var configTable = {
            "arrowFire":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:firebrick"></div>`,
            "arrowRescue":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:orangered"></div>`,
            "arrowPolice":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:green"></div>`,
            "arrowThw":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:midnightblue"></div>`,
            "arrowHospital":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:deepskyblue"></div>`,
            "marginLeft":`<div style="margin-left:1em">`
        };

        $.each(aVehicles, function(key, item){
            switch(item.vehicle_type){
                case 31: vehicles.rth ++;
                    break;
                case 61: vehicles.polHeli ++;
                    break;
                case 73: vehicles.grtw ++;
                    break;
                case 74: vehicles.naw ++;
                    break;
            }
            vehicles.onDispatchCenter.push({"name":item.caption,"lst":database.buildings.get.onDispatchCenter[item.building_id]});
        });

        if(!isNaN(options.dropdown.dispatchCenter.id)){
            for(let i = infoBuildingsDatabase.length - 1; i >= 0; i --){
                if(infoBuildingsDatabase[i].leitstelle_building_id && infoBuildingsDatabase[i].leitstelle_building_id !== options.dropdown.dispatchCenter.id){
                    infoBuildingsDatabase.splice(i,1);
                }
            }
            for(let i = vehicles.onDispatchCenter.length - 1; i >= 0; i --){
                if(vehicles.onDispatchCenter[i].lst !== options.dropdown.dispatchCenter.id){
                    vehicles.onDispatchCenter.splice(i,1);
                }
            }
        }

        $.each(infoBuildingsDatabase, function(key, item){
            switch(item.building_type){
                case 0: item.small_building ? buildings.fire.small.count ++ : buildings.fire.normal.count ++;
                    break;
                case 1: buildings.school.fire.count ++;
                    break;
                case 2: item.small_building ? buildings.rescue.small ++ : buildings.rescue.normal ++;
                    break;
                case 3: buildings.school.rescue.count ++;
                    break;
                case 4: buildings.hospital.count ++;
                    break;
                case 5:
                    if(item.enabled){
                        item.level > 0 ? buildings.helicopter.rescue.count += (item.level + 1) : buildings.helicopter.rescue.count ++;
                        item.level > 0 ? buildings.helicopter.rescue.active += (item.level + 1) : buildings.helicopter.rescue.active ++;
                    }
                    else item.level > 0 ? buildings.helicopter.rescue.count += (item.level + 1) : buildings.helicopter.rescue.count ++;
                    break;
                case 6: item.small_building ? buildings.police.small.count ++ : buildings.police.normal.count ++;
                    break;
                case 7: buildings.dispatchCenter ++;
                    break;
                case 8: buildings.school.police.count ++;
                    break;
                case 9: buildings.thw.count ++;
                    break;
                case 10: buildings.school.thw.count ++;
                    break;
                case 11: buildings.bepo.count ++;
                    break;
                case 12: buildings.seg.count ++;
                    break;
                case 13:
                    if(item.enabled){
                        item.level > 0 ? buildings.helicopter.police.count += (item.level + 1) : buildings.helicopter.police.count ++;
                        item.level > 0 ? buildings.helicopter.police.active += (item.level + 1) : buildings.helicopter.police.active ++;
                    }
                    else item.level > 0 ? buildings.helicopter.police.count += (item.level + 1) : buildings.helicopter.police.count ++;
                    break;
                case 14: buildings.stagingArea ++;
                    break;
                case 15: item.enabled ? buildings.wr.active ++ : buildings.wr.count ++;
                    break;
                case 17: buildings.polSonder.count ++;
                    break;
                case 21: item.enabled ? buildings.rescueDogs.active ++ : buildings.rescueDogs.count ++;
                    break;
            }
            if(item.building_type == 4) buildings.hospital.beds.build += item.level;
            if(item.extensions.length > 0){
                for(let i = 0; i < item.extensions.length; i ++){
                    var switchOptions = {
                        "active":item.extensions[i].enabled && item.extensions[i].available,
                        "build":item.extensions[i].available,
                        "onBuild":!item.extensions[i].available && item.extensions[i].enabled && showOnBuild
                    };
                    switch(item.extensions[i].caption){
                        case "Großwache":
                            if(switchOptions.build) buildings.fire.normal.big.build ++;
                            if(switchOptions.onBuild) buildings.fire.normal.big.onBuild ++;
                            break;
                        case "Rettungsdienst-Erweiterung":
                            if(switchOptions.build) buildings.fire.normal.rescue.build ++;
                            if(switchOptions.active) buildings.fire.normal.rescue.active ++;
                            if(switchOptions.onBuild) buildings.fire.normal.rescue.onBuild ++;
                            break;
                        case "Werkfeuerwehr":
                            if(switchOptions.build) buildings.fire.normal.industry.build ++;
                            if(switchOptions.active) buildings.fire.normal.industry.active ++;
                            if(switchOptions.onBuild) buildings.fire.normal.industry.onBuild ++;
                            break;
                        case "Flughafen-Erweiterung":
                            if(switchOptions.build) buildings.fire.normal.airport.build ++;
                            if(switchOptions.active) buildings.fire.normal.airport.active ++;
                            if(switchOptions.onBuild) buildings.fire.normal.airport.onBuild ++;
                            break;
                        case "Führung":
                            if(switchOptions.build) buildings.seg.leader.build ++;
                            if(switchOptions.active) buildings.seg.leader.active ++;
                            if(switchOptions.onBuild) buildings.seg.leader.onBuild ++;
                            break;
                        case "Sanitätsdienst":
                            if(switchOptions.build) buildings.seg.sanD.build ++;
                            if(switchOptions.active) buildings.seg.sanD.active ++;
                            if(switchOptions.onBuild) buildings.seg.sanD.onBuild ++;
                            break;
                        case "Wasserrettungs-Erweiterung":
                            if(switchOptions.build){
                                if(item.building_type == 0) buildings.fire.normal.wr.build ++;
                                else if(item.building_type == 12) buildings.seg.wr.build ++;
                            }
                            if(switchOptions.active){
                                if(item.building_type == 0) buildings.fire.normal.wr.active ++;
                                else if(item.building_type == 12) buildings.seg.wr.active ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 0) buildings.fire.normal.wr.onBuild ++;
                                else if(item.building_type == 12) buildings.seg.wr.onBuild ++;
                            }
                            break;
                        case "Rettungshundestaffel":
                            if(switchOptions.build) buildings.seg.dogs.build ++;
                            if(switchOptions.active) buildings.seg.dogs.active ++;
                            if(switchOptions.onBuild) buildings.seg.dogs.onBuild ++;
                            break;
                        case "Abrollbehälter-Stellplatz":
                            if(switchOptions.build) item.small_building ? buildings.fire.small.ab.build ++ : buildings.fire.normal.ab.build ++;
                            if(switchOptions.onBuild) item.small_building ? buildings.fire.small.ab.onBuild ++ : buildings.fire.normal.ab.onBuild ++;
                            break;
                        case "2. Zug der 1. Hundertschaft":
                            if(switchOptions.build) buildings.bepo.division.second.build ++;
                            if(switchOptions.active) buildings.bepo.division.second.active ++;
                            if(switchOptions.onBuild) buildings.bepo.division.second.onBuild ++;
                            break;
                        case "3. Zug der 1. Hundertschaft":
                            if(switchOptions.build) buildings.bepo.division.third.build ++;
                            if(switchOptions.active) buildings.bepo.division.third.active ++;
                            if(switchOptions.onBuild) buildings.bepo.division.third.onBuild ++;
                            break;
                        case "Sonderfahrzeug: Gefangenenkraftwagen":
                            if(switchOptions.build) buildings.bepo.mobilePrison.build ++;
                            if(switchOptions.active) buildings.bepo.mobilePrison.active ++;
                            if(switchOptions.onBuild) buildings.bepo.mobilePrison.onBuild ++;
                            break;
                        case "Technischer Zug: Wasserwerfer":
                            if(switchOptions.build) buildings.bepo.waterthrower.build ++;
                            if(switchOptions.active) buildings.bepo.waterthrower.active ++;
                            if(switchOptions.onBuild) buildings.bepo.waterthrower.onBuild ++;
                            break;
                        case "SEK: 1. Zug":
                            if(switchOptions.build){
                                if(item.building_type == 11) buildings.bepo.sek.first.build ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.build ++;
                            }
                            if(switchOptions.active){
                                if(item.building_type == 11) buildings.bepo.sek.first.active ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.active ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 11) buildings.bepo.sek.first.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.onBuild ++;
                            }
                            break;
                        case "SEK: 2. Zug":
                            if(switchOptions.build){
                                if(item.building_type == 11) buildings.bepo.sek.second.build ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.build ++;
                            }
                            if(switchOptions.active){
                                if(item.building_type == 11) buildings.bepo.sek.second.active ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.active ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 11) buildings.bepo.sek.second.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.onBuild ++;
                            }
                            break;
                        case "MEK: 1. Zug":
                            if(switchOptions.build){
                                if(item.building_type == 11) buildings.bepo.mek.first.build ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.build ++;
                            }
                            if(switchOptions.active){
                                if(item.building_type == 11) buildings.bepo.mek.first.active ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.active ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 11) buildings.bepo.mek.first.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.onBuild ++;
                            }
                            break;
                        case "MEK: 2. Zug":
                            if(switchOptions.build){
                                if(item.building_type == 11) buildings.bepo.mek.second.build ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.build ++;
                            }
                            if(switchOptions.active){
                                if(item.building_type == 11) buildings.bepo.mek.second.active ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.active ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 11) buildings.bepo.mek.second.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.onBuild ++;
                            }
                            break;
                        case "1. Technischer Zug: Bergungsgruppe 2":
                            if(switchOptions.build) buildings.thw.firstTz.bg.build ++;
                            if(switchOptions.active) buildings.thw.firstTz.bg.active ++;
                            if(switchOptions.onBuild) buildings.thw.firstTz.bg.onBuild ++;
                            break;
                        case "1. Technischer Zug: Zugtrupp":
                            if(switchOptions.build) buildings.thw.firstTz.zug.build ++;
                            if(switchOptions.active) buildings.thw.firstTz.zug.active ++;
                            if(switchOptions.onBuild) buildings.thw.firstTz.zug.onBuild ++;
                            break;
                        case "Fachgruppe Räumen":
                            if(switchOptions.build) buildings.thw.fgrR.build ++;
                            if(switchOptions.active) buildings.thw.fgrR.active ++;
                            if(switchOptions.onBuild) buildings.thw.fgrR.onBuild ++;
                            break;
                        case "Fachgruppe Wassergefahren":
                            if(switchOptions.build) buildings.thw.fgrW.build ++;
                            if(switchOptions.active) buildings.thw.fgrW.active ++;
                            if(switchOptions.onBuild) buildings.thw.fgrW.onBuild ++;
                            break;
                        case "2. Technischer Zug - Grundvorraussetzungen":
                            if(switchOptions.build) buildings.thw.secondTz.grund.build ++;
                            if(switchOptions.active) buildings.thw.secondTz.grund.active ++;
                            if(switchOptions.onBuild) buildings.thw.secondTz.grund.onBuild ++;
                            break;
                        case "2. Technischer Zug: Bergungsgruppe 2":
                            if(switchOptions.build) buildings.thw.secondTz.bg.build ++;
                            if(switchOptions.active) buildings.thw.secondTz.bg.active ++;
                            if(switchOptions.onBuild) buildings.thw.secondTz.bg.onBuild ++;
                            break;
                        case "2. Technischer Zug: Zugtrupp":
                            if(switchOptions.build) buildings.thw.secondTz.zug.build ++;
                            if(switchOptions.active) buildings.thw.secondTz.zug.active ++;
                            if(switchOptions.onBuild) buildings.thw.secondTz.zug.onBuild ++;
                            break;
                        case "Fachgruppe Ortung":
                            if(switchOptions.build) buildings.thw.fgrO.build ++;
                            if(switchOptions.active) buildings.thw.fgrO.active ++;
                            if(switchOptions.onBuild) buildings.thw.fgrO.onBuild ++;
                            break;
                        case "Allgemeine Innere":
                            if(switchOptions.build) buildings.hospital.extension.ina.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.ina.onBuild ++;
                            break;
                        case "Allgemeine Chirurgie":
                            if(switchOptions.build) buildings.hospital.extension.ach.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.ach.onBuild ++;
                            break;
                        case "Gynäkologie":
                            if(switchOptions.build) buildings.hospital.extension.gyn.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.gyn.onBuild ++;
                            break;
                        case "Urologie":
                            if(switchOptions.build) buildings.hospital.extension.uro.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.uro.onBuild ++;
                            break;
                        case "Unfallchirurgie":
                            if(switchOptions.build) buildings.hospital.extension.uch.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.uch.onBuild ++;
                            break;
                        case "Neurologie":
                            if(switchOptions.build) buildings.hospital.extension.nrl.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.nrl.onBuild ++;
                            break;
                        case "Neurochirurgie":
                            if(switchOptions.build) if(switchOptions.build) buildings.hospital.extension.nch.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.nch.onBuild ++;
                            break;
                        case "Kardiologie":
                            if(switchOptions.build) buildings.hospital.extension.kar.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.kar.onBuild ++;
                            break;
                        case "Kardiochirurgie":
                            if(switchOptions.build) buildings.hospital.extension.kch.build ++;
                            if(switchOptions.onBuild) buildings.hospital.extension.kch.onBuild ++;
                            break;
                        case "Zelle":
                            if(switchOptions.build) item.small_building ? buildings.police.small.cell.build ++ : buildings.police.normal.cell.build ++;
                            if(switchOptions.onBuild) item.small_building ? buildings.police.small.cell.onBuild ++ : buildings.police.normal.cell.onBuild ++;
                            break;
                        case "Weiterer Klassenraum":
                            if(switchOptions.build){
                                if(item.building_type == 1) buildings.school.fire.rooms.build ++;
                                else if(item.building_type == 3) buildings.school.rescue.rooms.build ++;
                                else if(item.building_type == 8) buildings.school.police.rooms.build ++;
                                else if(item.building_type == 10) buildings.school.thw.rooms.build ++;
                            }
                            if(switchOptions.onBuild){
                                if(item.building_type == 1) buildings.school.fire.rooms.onBuild ++;
                                else if(item.building_type == 3) buildings.school.rescue.rooms.onBuild ++;
                                else if(item.building_type == 8) buildings.school.police.rooms.onBuild ++;
                                else if(item.building_type == 10) buildings.school.thw.rooms.onBuild ++;
                            }
                            break;
                    }
                }
            }
        });

        $('#tableStatusLabel').html(`<div class="pull-left"><span class="lightbox-open" style="cursor:pointer" href="/profile/${aCredits.user_id}">${aCredits.user_name} (${aCredits.user_id})</span></div>
                                     <div class="pull-right" style="margin-right:3em">Toplist-Platz: <span class="lightbox-open" style="cursor:pointer" href="${Math.ceil(aCredits.user_toplist_position / 20) > 1 ?
                                                                                                                                     `/toplist?page=${Math.ceil(aCredits.user_toplist_position / 20)}` :
                                                                                                                                     `/toplist`}">${aCredits.user_toplist_position.toLocaleString()}</span></div>`);

        let userInfos =
                `<table class="table">
                 <thead>
                 <tr>
                 <th class="col">Bezeichnung<br>&nbsp;</th>
                 <th class="col-1"><center>Anzahl<br>${showOnBuild ? `ist (aktiv) / max / Ausbau` : `ist (aktiv) / max`}</center></th>
                 </tr>
                 </thead>
                 <tbody>`;

        function infoContentOneValue(name, value){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1"><center>${value.toLocaleString()}</center></td>
                          </tr>`;
        }

        function percentage(name, value){
            var percent = Math.round(value / (infoBuildingsDatabase.length - buildings.dispatchCenter) * 100);
            userInfos += `<tr>
                          <td class="col">${name}</div></td>
                          <td class="col-1"><center>${value} (${percent}&percnt;)</center></td>
                          </tr>`;
        }

        function infoContentMax(name, valueNow, valueMax){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1"><center>${valueNow == 0 ? `<span style="color:red">${valueNow.toLocaleString()}</span>` : valueNow < valueMax ?
                                                                      `<span style="color:orange">${valueNow.toLocaleString()}</span>` :
                                                                      `<span style="color:limegreen">${valueNow.toLocaleString()}</span>`} / ${valueMax.toLocaleString()}</center></td>
                          </tr>`;
        }

        function percentageMax(name, valueNow, valueMax){
            var percent = Math.round(valueMax / (infoBuildingsDatabase.length - buildings.dispatchCenter) * 100);
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1"><center>${valueNow == 0 ? `<span style="color:red">${valueNow.toLocaleString()}</span>` : valueNow < valueMax ?
                                                                      `<span style="color:orange">${valueNow.toLocaleString()}</span>` :
                                                                      `<span style="color:limegreen">${valueNow.toLocaleString()}</span>`} / ${valueMax.toLocaleString()} (${percent}&percnt;)</center></td>
                          </tr>`;
        }

        function infoContentOnBuild(name, valueNow, valueMax, valueOnBuild){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1"><center>${valueNow == 0 ? `<span style="color:red">${valueNow.toLocaleString()}</span>` : valueNow < valueMax ?
                                                                      `<span style="color:orange">${valueNow.toLocaleString()}</span>` :
                                                                      `<span style="color:limegreen">${valueNow.toLocaleString()}</span>`} / ${valueMax.toLocaleString()} / <span style="color:mediumslateblue">${valueOnBuild.toLocaleString()}</span></center></td>
                          </tr>`;
        }

        function tableExtension(name, typeArrow, valueNow, valueMax, valueOnBuild){
            var showOnTable = `${typeArrow} ${name}`;
            if(valueMax > 0 || valueOnBuild > 0){
                if(valueOnBuild > 0) infoContentOnBuild(showOnTable, valueNow, valueMax, valueOnBuild);
                else infoContentMax(showOnTable, valueNow, valueMax);
            }
        }

        function rescueVehicles(html, value){
            if(user_premium ? value >= 15 : value >= 20){
                infoContentMax(`${html} Großraumrettungswagen (GRTW)`, vehicles.grtw, user_premium ? Math.floor(value / 15) : Math.floor(value / 20));
            }
            infoContentMax(`${html} Notarztwagen (NAW)`, vehicles.naw, value);
        }

        isNaN(options.dropdown.dispatchCenter.id) ? infoContentOneValue("Fahrzeuge", aVehicles.length) : infoContentMax("Fahrzeuge", vehicles.onDispatchCenter.length, aVehicles.length);

        if(buildings.helicopter.rescue.count == 0) infoContentMax(`${configTable.marginLeft}Rettungshubschrauber (RTH)</div>`, vehicles.rth, Math.floor(aBuildings.length / 25) > 4 ? Math.floor(aBuildings.length / 25) : 4);

        if(buildings.helicopter.police.count == 0) infoContentMax(`${configTable.marginLeft}Polizeihubschrauber</div>`, vehicles.polHeli, Math.floor(aBuildings.length / 25) > 4 ? Math.floor(aBuildings.length / 25) : 4);

        isNaN(options.dropdown.dispatchCenter.id) ? infoContentOneValue("Gebäude", aBuildings.length) : infoContentMax("Gebäude", infoBuildingsDatabase.length - buildings.dispatchCenter, aBuildings.length);

        infoContentMax(`${configTable.marginLeft}Leitstellen</div>`, buildings.dispatchCenter, Math.ceil(aBuildings.length / 25) > 0 ? Math.ceil(aBuildings.length / 25) : 1);

        if(buildings.stagingArea > 0) infoContentOneValue(`${configTable.marginLeft}Bereitstellungsräume (BSR)</div>`, buildings.stagingArea);

        if(buildings.fire.small.count > 0){
            percentage(`${configTable.marginLeft}Feuerwachen (klein)</div>`, buildings.fire.small.count);
            if(buildings.fire.small.ab.build > 0 || buildings.fire.small.ab.onBuild > 0){
                tableExtension(`AB-Stellplätze`, configTable.arrowFire, buildings.fire.small.ab.build, buildings.fire.small.build * 2, buildings.fire.small.ab.onBuild);
            }
        }

        if(buildings.fire.normal.count > 0){
            percentage(`${configTable.marginLeft}Feuerwachen</div>`, buildings.fire.normal.count);
            if(Math.floor((buildings.fire.small.count + buildings.fire.normal.count) / 10) > 0){
                tableExtension(`Großwache`, configTable.arrowFire, buildings.fire.normal.big.build, Math.floor((buildings.fire.normal.count + buildings.fire.small.count) / 10), buildings.fire.normal.big.onBuild);
            }
            tableExtension(`Rettungsdienst-Erweiterung`, configTable.arrowFire, buildings.fire.normal.rescue.active, buildings.fire.normal.rescue.build, buildings.fire.normal.rescue.onBuild);
            if(buildings.fire.normal.rescue.active > 0){
                if(buildings.rescue.normal == 0 && buildings.rescue.small == 0){
                    rescueVehicles(`<div class="glyphicon glyphicon-arrow-right" style="margin-left:3em;color:orangered"></div>`, buildings.fire.rescue.active);
                }
            }
            tableExtension(`Wasserrettungs-Erweiterung`, configTable.arrowFire, buildings.fire.normal.wr.active, buildings.fire.normal.wr.build, buildings.fire.normal.wr.onBuild);
            tableExtension(`Flughafen-Erweiterung`, configTable.arrowFire, buildings.fire.normal.airport.active, buildings.fire.normal.airport.build, buildings.fire.normal.airport.onBuild);
            tableExtension(`Werkfeuerwehr`, configTable.arrowFire, buildings.fire.normal.industry.active, buildings.fire.normal.industry.build, buildings.fire.normal.industry.onBuild);
            if(buildings.fire.normal.ab.build > 0 || buildings.fire.normal.ab.onBuild > 0){
                tableExtension(`AB-Stellplätze`, configTable.arrowFire, buildings.fire.normal.ab.build, buildings.fire.normal.count * 9, buildings.fire.normal.ab.onBuild);
            }
        }

        if(buildings.school.fire.count > 0){
            percentage(`${configTable.marginLeft}Feuerwehrschulen</div>`, buildings.school.fire.count);
            tableExtension(`Klassenräume`, configTable.arrowFire, buildings.school.fire.rooms.build + buildings.school.fire.count, buildings.school.fire.count * 4, buildings.school.fire.rooms.onBuild);
        }

        if(buildings.rescue.small > 0){
            percentage(`${configTable.marginLeft}Rettungswachen (klein)</div>`, buildings.rescue.small);
            if(buildings.rescue.normal == 0){
                rescueVehicles(configTable.arrowRescue, buildings.rescue.small + buildings.fire.rescue.active);
            }
        }

        if(buildings.rescue.normal > 0){
            percentage(`${configTable.marginLeft}Rettungswachen</div>`, buildings.rescue.normal);
            rescueVehicles(configTable.arrowRescue, buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active);
        }

        if(buildings.seg.count > 0){
            percentage(`${configTable.marginLeft}Schnelleinsatzgruppen (SEG)</div>`, buildings.seg.count);
            tableExtension(`Führung`, configTable.arrowRescue, buildings.seg.leader.active, buildings.seg.leader.build, buildings.seg.leader.onBuild);
            tableExtension(`Sanitätsdienst`, configTable.arrowRescue, buildings.seg.sanD.active, buildings.seg.sanD.build, buildings.seg.sanD.onBuild);
            tableExtension(`Wasserrettungs-Erweiterung`, configTable.arrowRescue, buildings.seg.wr.active, buildings.seg.wr.build, buildings.seg.wr.onBuild);
            tableExtension(`Rettungshundestaffel`, configTable.arrowRescue, buildings.seg.dogs.active, buildings.seg.dogs.build, buildings.seg.dogs.onBuild);
        }

        if(buildings.wr.count > 0 || buildings.wr.active > 0){
            percentageMax(`${configTable.marginLeft}Wasserrettungswachen</div>`, buildings.wr.active, buildings.wr.count + buildings.wr.active);
        }

        if(buildings.rescueDogs.count > 0 || buildings.rescueDogs.active > 0){
            percentageMax(`${configTable.marginLeft}Rettungshundestaffeln</div>`, buildings.rescueDogs.active, buildings.rescueDogs.count + buildings.rescueDogs.active);
        }

        if(buildings.helicopter.rescue.count > 0){
            percentageMax(`${configTable.marginLeft}Rettungshubschrauber-Stationen</div>`, buildings.helicopter.rescue.active, buildings.helicopter.rescue.count);
            infoContentMax(`${configTable.arrowRescue} Rettungshubschrauber (RTH)`, vehicles.rth, Math.floor(aBuildings.length / 25) > 4 ? Math.floor(aBuildings.length / 25) : 4);
        }

        if(buildings.school.rescue.count > 0){
            percentage(`${configTable.marginLeft}Rettungsdienstschulen</div>`, buildings.school.rescue.count);
            tableExtension(`Klassenräume`, configTable.arrowRescue, buildings.school.rescue.rooms.build + buildings.school.rescue.count, buildings.school.rescue.count * 4, buildings.school.rescue.rooms.onBuild);
        }

        if(buildings.police.small.count > 0){
            percentage(`${configTable.marginLeft}Polizeiwachen (klein)</div>`, buildings.police.small.count);
            tableExtension(`Zellen`, configTable.arrowPolice, buildings.police.small.cell.build, buildings.police.small.count * 2, buildings.police.small.cell.onBuild);
        }

        if(buildings.police.normal.count > 0){
            percentage(`${configTable.marginLeft}Polizeiwachen</div>`, buildings.police.normal.count);
            tableExtension(`Zellen`, configTable.arrowPolice, buildings.police.normal.cell.build, buildings.police.normal.count * 10, buildings.police.normal.cell.onBuild);
        }

        if(buildings.bepo.count > 0){
            percentage(`${configTable.marginLeft}Bereitschaftspolizei</div>`, buildings.bepo.count);
            tableExtension(`2. Zug der 1. Hundertschaft`, configTable.arrowPolice, buildings.bepo.division.second.active, buildings.bepo.division.second.build, buildings.bepo.division.second.onBuild);
            tableExtension(`3. Zug der 1. Hundertschaft`, configTable.arrowPolice, buildings.bepo.division.third.active, buildings.bepo.division.third.build, buildings.bepo.division.third.onBuild);
            tableExtension(`Sonderfahrzeug: Gefangenenkraftwagen`, configTable.arrowPolice, buildings.bepo.mobilePrison.active, buildings.bepo.mobilePrison.build ,buildings.bepo.mobilePrison.onBuild);
            tableExtension(`Technischer Zug: Wasserwerfer`, configTable.arrowPolice, buildings.bepo.waterthrower.active, buildings.bepo.waterthrower.build ,buildings.bepo.waterthrower.onBuild);
            tableExtension(`SEK: 1. Zug`, configTable.arrowPolice, buildings.bepo.sek.first.active, buildings.bepo.sek.first.build, buildings.bepo.sek.first.onBuild);
            tableExtension(`SEK: 2. Zug`, configTable.arrowPolice, buildings.bepo.sek.second.active, buildings.bepo.sek.second.build, buildings.bepo.sek.second.onBuild);
            tableExtension(`MEK: 1. Zug`, configTable.arrowPolice, buildings.bepo.mek.first.active, buildings.bepo.mek.first.build, buildings.bepo.mek.first.onBuild);
            tableExtension(`MEK: 2. Zug`, configTable.arrowPolice, buildings.bepo.mek.second.active, buildings.bepo.mek.second.build, buildings.bepo.mek.second.onBuild);
        }

        if(buildings.polSonder.count > 0){
            percentage(`${configTable.marginLeft}Polizei-Sondereinheiten</div>`, buildings.polSonder.count);
            tableExtension(`SEK: 1. Zug`, configTable.arrowPolice, buildings.polSonder.sek.first.active, buildings.polSonder.sek.first.build, buildings.polSonder.sek.first.onBuild);
            tableExtension(`SEK: 2. Zug`, configTable.arrowPolice, buildings.polSonder.sek.second.active, buildings.polSonder.sek.second.build, buildings.polSonder.sek.second.onBuild);
            tableExtension(`MEK: 1. Zug`, configTable.arrowPolice, buildings.polSonder.mek.first.active, buildings.polSonder.mek.first.build, buildings.polSonder.mek.first.onBuild);
            tableExtension(`MEK: 2. Zug`, configTable.arrowPolice, buildings.polSonder.mek.second.active, buildings.polSonder.mek.second.build, buildings.polSonder.mek.second.onBuild);
        }

        if(buildings.helicopter.police.count > 0){
            percentageMax(`${configTable.marginLeft}Polizeihubschrauber-Stationen</div>`, buildings.helicopter.police.active, buildings.helicopter.police.count);
            infoContentMax(`${configTable.arrowPolice} Polizeihubschrauber`, vehicles.polHeli, Math.floor(aBuildings.length / 25) > 4 ? Math.floor(aBuildings.length / 25) : 4);
        }

        if(buildings.school.police.count > 0){
            percentage(`${configTable.marginLeft}Polizeischulen</div>`, buildings.school.police.count);
            tableExtension(`Klassenräume`, configTable.arrowPolice, buildings.school.police.rooms.build + buildings.school.police.count, buildings.school.police.count * 4, buildings.school.police.rooms.onBuild);
        }

        if(buildings.thw.count > 0){
            percentage(`${configTable.marginLeft}THW Ortsverbände</div>`, buildings.thw.count);
            tableExtension(`1. Technischer Zug: Bergungsgruppe 2`, configTable.arrowThw, buildings.thw.firstTz.bg.active, buildings.thw.firstTz.bg.build, buildings.thw.firstTz.bg.onBuild);
            tableExtension(`1. Technischer Zug: Zugtrupp`, configTable.arrowThw, buildings.thw.firstTz.zug.active, buildings.thw.firstTz.zug.build, buildings.thw.firstTz.zug.onBuild);
            tableExtension(`Fachgruppe Räumen`, configTable.arrowThw, buildings.thw.fgrR.active, buildings.thw.fgrR.build, buildings.thw.fgrR.onBuild);
            tableExtension(`Fachgruppe Wassergefahren`, configTable.arrowThw, buildings.thw.fgrW.active, buildings.thw.fgrW.build, buildings.thw.fgrW.onBuild);
            tableExtension(`2. Technischer Zug: Grundvoraussetzungen`, configTable.arrowThw, buildings.thw.secondTz.grund.active, buildings.thw.secondTz.grund.build, buildings.thw.secondTz.grund.onBuild);
            tableExtension(`2. Technischer Zug: Bergungsgruppe 2`, configTable.arrowThw, buildings.thw.secondTz.bg.active, buildings.thw.secondTz.bg.build, buildings.thw.secondTz.bg.onBuild);
            tableExtension(`2. Technischer Zug: Zugtrupp`, configTable.arrowThw, buildings.thw.secondTz.zug.active, buildings.thw.secondTz.zug.build, buildings.thw.secondTz.zug.onBuild);
            tableExtension(`Fachgruppe Ortung`, configTable.arrowThw, buildings.thw.fgrO.active, buildings.thw.fgrO.build, buildings.thw.fgrO.onBuild);
        }

        if(buildings.school.thw.count > 0){
            percentage(`${configTable.marginLeft}THW Bundesschulen</div>`, buildings.school.thw.count);
            tableExtension(`Klassenräume`, configTable.arrowThw, buildings.school.thw.rooms.build + buildings.school.thw.count, buildings.school.thw.count * 4, buildings.school.thw.rooms.onBuild);
        }

        if(buildings.hospital.count > 0){
            percentage(`${configTable.marginLeft}Krankenhäuser</div>`, buildings.hospital.count);
            infoContentMax(`${configTable.arrowHospital} Betten`, buildings.hospital.beds.build + (buildings.hospital.count * 10), buildings.hospital.count * 30);
            if(buildings.hospital.extension.ina.onBuild > 0 || buildings.hospital.extension.ach.onBuild > 0 || buildings.hospital.extension.gyn.onBuild > 0 ||
               buildings.hospital.extension.uro.onBuild > 0 || buildings.hospital.extension.uch.onBuild > 0 || buildings.hospital.extension.nrl.onBuild > 0 ||
               buildings.hospital.extension.nch.onBuild > 0 || buildings.hospital.extension.kar.onBuild > 0 || buildings.hospital.extension.kch.onBuild > 0){
                infoContentOnBuild(`${configTable.arrowHospital} Allgemeine Innere`, buildings.hospital.extension.ina.build, buildings.hospital.count, buildings.hospital.extension.ina.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Allgemeine Chirurgie`, buildings.hospital.extension.ach.build, buildings.hospital.count, buildings.hospital.extension.ach.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Gynäkologie`, buildings.hospital.extension.gyn.build, buildings.hospital.count, buildings.hospital.extension.gyn.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Urologie`, buildings.hospital.extension.uro.build, buildings.hospital.count, buildings.hospital.extension.uro.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Unfallchirurgie`, buildings.hospital.extension.uch.build, buildings.hospital.count, buildings.hospital.extension.uch.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Neurologie`, buildings.hospital.extension.nrl.build, buildings.hospital.count, buildings.hospital.extension.nrl.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Neurochirurgie`, buildings.hospital.extension.nch.build, buildings.hospital.count, buildings.hospital.extension.nch.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Kardiologie`, buildings.hospital.extension.kar.build, buildings.hospital.count, buildings.hospital.extension.kar.onBuild);
                infoContentOnBuild(`${configTable.arrowHospital} Kardiochirurgie`, buildings.hospital.extension.kch.build, buildings.hospital.count, buildings.hospital.extension.kch.onBuild);
            }
            else{
                infoContentMax(`${configTable.arrowHospital} Allgemeine Innere`, buildings.hospital.extension.ina.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Allgemeine Chirurgie`, buildings.hospital.extension.ach.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Gynäkologie`, buildings.hospital.extension.gyn.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Urologie`, buildings.hospital.extension.uro.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Unfallchirurgie`, buildings.hospital.extension.uch.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Neurologie`, buildings.hospital.extension.nrl.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Neurochirurgie`, buildings.hospital.extension.nch.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Kardiologie`, buildings.hospital.extension.kar.build, buildings.hospital.count);
                infoContentMax(`${configTable.arrowHospital} Kardiochirurgie`, buildings.hospital.extension.kch.build, buildings.hospital.count);
            }
        }

        userInfos += `</tbody></table>`;

        $('#tableStatusBody').html(userInfos);
    }

    var btn = {
        "s":"btn btn-success btn-xs",
        "d":"btn btn-danger btn-xs",
        "i":"btn btn-info btn-xs",
        "w":"btn btn-warning btn-xs"
    };

    $("body").on("click", "#vehicleManagement", function(){
        $('#filterDispatchCenter').html(`<option selected>wird geladen ...</option>`);
        $('#filterType').html(`<option selected>wird geladen ...</option>`);
        $('#tableStatusLabel').html('');
        $('#tableStatusBody').html('');
        options.status.count = 0;
        database.buildings.get.typeId.length = 0;
        database.buildings.get.name.length = 0;
        database.buildings.get.onDispatchCenter.length = 0;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        apiDropdown();
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

    $("body").on("click", "#filterDispatchCenter", function(){
        options.dropdown.dispatchCenter.id = parseInt($('#filterDispatchCenter').val());
        options.status.count == 0 ? playerInfos() : createTable(options.status.count);
    });

    $("body").on("click", "#filterType", function(){
            options.dropdown.vehicles.type = parseInt($('#filterType').val());
            options.dropdown.vehicles.ownClass = $('#filterType').find(':selected').data('vehicle');
            if(options.status.count !== 0) createTable(options.status.count);
    });

    $("body").on("click", "#sortBy", function(){
        if(options.status.count !== 0) createTable(options.status.count);
    });

    $("body").on("click", "#filterFw", function(){

        options.filter.fire.counter ++;

        if(options.filter.fire.counter === 1){
            options.filter.fire.timer = setTimeout(function(){
                options.filter.fire.status = !options.filter.fire.status;
                $('#filterFw').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.fire.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.fire.timer);
            options.filter.fire.status = true;
            $('#filterFw').removeClass().addClass(btn.s);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.fire.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterRd", function(){

        options.filter.rescue.counter ++;

        if(options.filter.rescue.counter === 1){
            options.filter.rescue.timer = setTimeout(function(){
                options.filter.rescue.status = !options.filter.rescue.status;
                $('#filterRd').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.rescue.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.rescue.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = true;
            $('#filterRd').removeClass().addClass(btn.s);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.rescue.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterThw", function(){

        options.filter.thw.counter ++;

        if(options.filter.thw.counter === 1){
            options.filter.thw.timer = setTimeout(function(){
                options.filter.thw.status = !options.filter.thw.status;
                $('#filterThw').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.thw.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.thw.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = true;
            $('#filterThw').removeClass().addClass(btn.s);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.thw.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterPol", function(){

        options.filter.police.counter ++;

        if(options.filter.police.counter === 1){
            options.filter.police.timer = setTimeout(function(){
                options.filter.police.status = !options.filter.police.status;
                $('#filterPol').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.police.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.police.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = true;
            $('#filterPol').removeClass().addClass(btn.s);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.police.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterWr", function(){

        options.filter.wr.counter ++;

        if(options.filter.wr.counter === 1){
            options.filter.wr.timer = setTimeout(function(){
                options.filter.wr.status = !options.filter.wr.status;
                $('#filterWr').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.wr.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.wr.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = true;
            $('#filterWr').removeClass().addClass(btn.s);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.wr.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterHeli", function(){

        options.filter.helicopter.counter ++;

        if(options.filter.helicopter.counter === 1){
            options.filter.helicopter.timer = setTimeout(function(){
                options.filter.helicopter.status = !options.filter.helicopter.status;
                $('#filterHeli').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.helicopter.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.helicopter.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = true;
            $('#filterHeli').removeClass().addClass(btn.s);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.helicopter.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterBp", function(){

        options.filter.bepo.counter ++;

        if(options.filter.bepo.counter === 1){
            options.filter.bepo.timer = setTimeout(function(){
                options.filter.bepo.status = !options.filter.bepo.status;
                $('#filterBp').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.bepo.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.bepo.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = true;
            $('#filterBp').removeClass().addClass(btn.s);
            options.filter.seg.status = false;
            $('#filterSeg').removeClass().addClass(btn.d);
            options.filter.bepo.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#filterSeg", function(){

        options.filter.seg.counter ++;

        if(options.filter.seg.counter === 1){
            options.filter.seg.timer = setTimeout(function(){
                options.filter.seg.status = !options.filter.seg.status;
                $('#filterSeg').toggleClass("btn-success btn-danger");
                if(options.status.count !== 0) createTable(options.status.count);
                options.filter.seg.counter = 0;
            }, options.filter.delay);
        }
        else{
            clearTimeout(options.filter.seg.timer);
            options.filter.fire.status = false;
            $('#filterFw').removeClass().addClass(btn.d);
            options.filter.rescue.status = false;
            $('#filterRd').removeClass().addClass(btn.d);
            options.filter.thw.status = false;
            $('#filterThw').removeClass().addClass(btn.d);
            options.filter.police.status = false;
            $('#filterPol').removeClass().addClass(btn.d);
            options.filter.wr.status = false;
            $('#filterWr').removeClass().addClass(btn.d);
            options.filter.helicopter.status = false;
            $('#filterHeli').removeClass().addClass(btn.d);
            options.filter.bepo.status = false;
            $('#filterBp').removeClass().addClass(btn.d);
            options.filter.seg.status = true;
            $('#filterSeg').removeClass().addClass(btn.s);
            options.filter.seg.counter = 0;
            if(options.status.count !== 0) createTable(options.status.count);
        }
    });

    $("body").on("click", "#player", function(){
        options.status.count = 0;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        playerInfos();
    });

    $("body").on("click", "#complete", function(){
        options.status.count = "1 bis 9";
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.s);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms1", function(){
        options.status.count = 1;
        $('#fms1').removeClass().addClass(btn.s);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms2", function(){
        options.status.count = 2;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.s);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms3", function(){
        options.status.count = 3;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.s);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms4", function(){
        options.status.count = 4;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.s);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms5", function(){
        options.status.count = 5;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.s);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms6", function(){
        options.status.count = 6;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.s);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms7", function(){
        options.status.count = 7;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.s);
        $('#fms9').removeClass().addClass(btn.i);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

    $("body").on("click", "#fms9", function(){
        options.status.count = 9;
        $('#fms1').removeClass().addClass(btn.i);
        $('#fms2').removeClass().addClass(btn.i);
        $('#fms3').removeClass().addClass(btn.i);
        $('#fms4').removeClass().addClass(btn.i);
        $('#fms5').removeClass().addClass(btn.i);
        $('#fms6').removeClass().addClass(btn.i);
        $('#fms7').removeClass().addClass(btn.i);
        $('#fms9').removeClass().addClass(btn.s);
        $('#complete').removeClass().addClass(btn.w);
        createTable(options.status.count);
    });

})();
