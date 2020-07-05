// ==UserScript==
// @name         Fuhrpark-Manager
// @version      1.12.0
// @author       DrTraxx
// @include      *://www.leitstellenspiel.de/
// @include      *://leitstellenspiel.de/
// @grant        none
// ==/UserScript==
/* global $ */

(function() {
    'use strict';

    var buttonOnRadio = true; //true: shows button on radio-panel; false: shows button on header
    var showOnBuild = true; //true: zeigt Ausbauten im Ausbau; false: Ausbauten im Ausbau werden nicht gezeigt

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
                              <select id="filterDispatchCenter" class="custom-select">
                               <option selected>wird geladen ...</option>
                              </select><br>
                              <select id="filterType" class="custom-select">
                               <option selected>wird geladen ...</option>
                              </select><br>
                              <select id="sortBy" class="custom-select">
                               <option selected>unsortiert</option>
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

    var preferences = {"filter":{"fire":true,"rescue":true,"thw":true,"police":true,"wr":true,"helicopter":true,"bepo":true,"seg":true},
                       "dropdown":{"vehicles":{"ownClass":$('#filterType').find(':selected').data('vehicle'),
                                               "type":parseInt($('#filterType').val())
                                              },
                                   "dispatchCenter":{"id":parseInt($('#filterDispatchCenter').val())}
                                  },
                       "status":{"count":0}
                      };
    var vehicleDatabase = {};
    var buildingsDatabase = {};
    var getBuildingTypeId = {};
    var getBuildingName = {};
    var getBuildingsOnDispatchCenter = {};
    var vehicleDatabaseFms = {};
    var creditsDatabase = {};

    $.getJSON('https://lss-manager.de/api/cars.php?lang=de_DE').done(function(data){
        var mapObj = {"ï¿½": "Ö", "Ã¶": "ö", "Ã¼": "ü", "Ã\u0096": "Ö"};
        $.each(data, (k,v) => {
            v.name = v.name.replace(new RegExp(Object.keys(mapObj).join("|"),"gi"), matched => mapObj[matched])
        });
        vehicleDatabase = data;
    });

    function loadApi(){

        $.getJSON('/api/buildings').done(function(data){
            buildingsDatabase = data;
            $.each(data, function(key, item){
                getBuildingTypeId[item.id] = item.building_type;
                getBuildingName[item.id] = item.caption;
                getBuildingsOnDispatchCenter[item.id] = item.leitstelle_building_id;
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
            if(isNaN(preferences.dropdown.vehicles.type)){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
            else if(preferences.dropdown.vehicles.type == -1 && preferences.dropdown.vehicles.ownClass == item.vehicle_type_caption){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
            else if(preferences.dropdown.vehicles.type == item.vehicle_type && !item.vehicle_type_caption){
                if(isNaN(statusIndex)) tableDatabase.push(pushContent);
                else if(statusIndex == item.fms_real) tableDatabase.push(pushContent);
            }
        });

        if(!isNaN(preferences.dropdown.dispatchCenter.id)){
            for(let i = tableDatabase.length - 1; i >= 0; i --){
                if(preferences.dropdown.dispatchCenter.id !== getBuildingsOnDispatchCenter[tableDatabase[i].buildingId]) tableDatabase.splice(i,1);
            }
        }

        function filterDatabase(typeId1, typeId2){
            for(let i = tableDatabase.length - 1; i >= 0; i--){
                if(getBuildingTypeId[tableDatabase[i].buildingId] == typeId1 || getBuildingTypeId[tableDatabase[i].buildingId] == typeId2) tableDatabase.splice(i,1);
            }
        }

        if(!preferences.filter.fire) filterDatabase("0", "18");
        if(!preferences.filter.rescue) filterDatabase("2", "20");
        if(!preferences.filter.thw) filterDatabase("9", "9");
        if(!preferences.filter.police) filterDatabase("6", "19");
        if(!preferences.filter.wr) filterDatabase("15", "15");
        if(!preferences.filter.helicopter) filterDatabase("5", "13");
        if(!preferences.filter.bepo) filterDatabase("11", "17");
        if(!preferences.filter.seg) filterDatabase("12", "21");

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

        var infoBuildingsDatabase = buildingsDatabase.slice(0);
        var vehicles = {"rth":0,"polHeli":0,"grtw":0,"naw":0};
        var buildings ={"fire":{"normal":{"count":0,
                                          "big":{"build":0,"onBuild":0},
                                          "rescue":{"build":0,"active":0,"onBuild":0},
                                          "industry":{"build":0,"active":0,"onBuild":0},
                                          "airport":{"build":0,"active":0,"onBuild":0},
                                          "wr":{"build":0,"active":0,"onBuild":0},
                                          "ab":{"build":0,"onBuild":0}
                                         },
                                "small":{"count":0,
                                         "ab":{"build":0,"onBuild":0}
                                        },
                               },
                        "rescue":{"normal":0,"small":0},
                        "police":{"normal":{"count":0,
                                            "cell":{"build":0,"onBuild":0}
                                           },
                                  "small":{"count":0,
                                           "cell":{"build":0,"onBuild":0}
                                          }
                                 },
                        "seg":{"count":0,
                               "leader":{"build":0,"active":0,"onBuild":0},
                               "sanD":{"build":0,"active":0,"onBuild":0},
                               "wr":{"build":0,"active":0,"onBuild":0},
                               "dogs":{"build":0,"active":0,"onBuild":0}
                              },
                        "bepo":{"count":0,
                                "division":{"second":{"build":0,"active":0,"onBuild":0},
                                            "third":{"build":0,"active":0,"onBuild":0},
                                           },
                                "waterthrower":{"build":0,"active":0,"onBuild":0},
                                "mobilePrison":{"build":0,"active":0,"onBuild":0},
                                "sek":{"first":{"build":0,"active":0,"onBuild":0},
                                       "second":{"build":0,"active":0,"onBuild":0},
                                      },
                                "mek":{"first":{"build":0,"active":0,"onBuild":0},
                                       "second":{"build":0,"active":0,"onBuild":0}
                                      }
                               },
                        "polSonder":{"count":0,
                                     "sek":{"first":{"build":0,"active":0,"onBuild":0},
                                            "second":{"build":0,"active":0,"onBuild":0},
                                           },
                                     "mek":{"first":{"build":0,"active":0,"onBuild":0},
                                            "second":{"build":0,"active":0,"onBuild":0}
                                           }
                                    },
                        "wr":{"count":0,"active":0},
                        "rescueDogs":{"count":0,"active":0},
                        "helicopter":{"rescue":{"count":0,"active":0},
                                      "police":{"count":0,"active":0}
                                     },
                        "thw":{"count":0,
                               "firstTz":{"bg":{"build":0,"active":0,"onBuild":0},
                                          "zug":{"build":0,"active":0,"onBuild":0}
                                         },
                               "secondTz":{"grund":{"build":0,"active":0,"onBuild":0},
                                           "bg":{"build":0,"active":0,"onBuild":0},
                                           "zug":{"build":0,"active":0,"onBuild":0}
                                          },
                               "fgrO":{"build":0,"active":0,"onBuild":0},
                               "fgrR":{"build":0,"active":0,"onBuild":0},
                               "fgrW":{"build":0,"active":0,"onBuild":0}
                              },
                        "school":{"fire":{"count":0,
                                          "rooms":{"build":0,"onBuild":0}
                                         },
                                  "rescue":{"count":0,
                                            "rooms":{"build":0,"onBuild":0}
                                           },
                                  "police":{"count":0,
                                            "rooms":{"build":0,"onBuild":0}
                                           },
                                  "thw":{"count":0,
                                         "rooms":{"build":0,"onBuild":0}
                                        },
                                 },
                        "hospital":{"count":0,
                                    "beds":{"build":0,"onBuild":0},
                                    "extension":{"ina":{"build":0,"onBuild":0},
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
        var configTable = {"arrowFire":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:firebrick"></div>`,
                           "arrowRescue":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:orangered"></div>`,
                           "arrowPolice":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:green"></div>`,
                           "arrowThw":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:midnightblue"></div>`,
                           "arrowHospital":`<div class="glyphicon glyphicon-arrow-right" style="margin-left:2em;color:deepskyblue"></div>`
                          };

        $.each(vehicleDatabaseFms, function(key, item){
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
        });

        if(!isNaN(preferences.dropdown.dispatchCenter.id)){
            for(let i = infoBuildingsDatabase.length - 1; i >= 0; i --){
                if(infoBuildingsDatabase[i].leitstelle_building_id && infoBuildingsDatabase[i].leitstelle_building_id !== preferences.dropdown.dispatchCenter.id){
                    infoBuildingsDatabase.splice(i,1);
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
                    switch(item.extensions[i].caption){
                        case "Großwache":
                            if(item.extensions[i].available) buildings.fire.normal.big.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.fire.normal.big.onBuild ++;
                            break;
                        case "Rettungsdienst-Erweiterung":
                            if(item.extensions[i].available) buildings.fire.normal.rescue.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.fire.normal.rescue.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.fire.normal.rescue.onBuild ++;
                            break;
                        case "Werkfeuerwehr":
                            if(item.extensions[i].available) buildings.fire.normal.industry.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.fire.normal.industry.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.fire.normal.industry.onBuild ++;
                            break;
                        case "Flughafen-Erweiterung":
                            if(item.extensions[i].available) buildings.fire.normal.airport.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.fire.normal.airport.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.fire.normal.airport.onBuild ++;
                            break;
                        case "Führung":
                            if(item.extensions[i].available) buildings.seg.leader.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.seg.leader.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.seg.leader.onBuild ++;
                            break;
                        case "Sanitätsdienst":
                            if(item.extensions[i].available) buildings.seg.sanD.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.seg.sanD.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.seg.sanD.onBuild ++;
                            break;
                        case "Wasserrettungs-Erweiterung":
                            if(item.extensions[i].available){
                                if(item.building_type == 0) buildings.fire.normal.wr.build ++;
                                else if(item.building_type == 12) buildings.seg.wr.build ++;
                            }
                            if(item.extensions[i].enabled && item.extensions[i].available){
                                if(item.building_type == 0) buildings.fire.normal.wr.active ++;
                                else if(item.building_type == 12) buildings.seg.wr.active ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
                                if(item.building_type == 0) buildings.fire.normal.wr.onBuild ++;
                                else if(item.building_type == 12) buildings.seg.wr.onBuild ++;
                            }
                            break;
                        case "Rettungshundestaffel":
                            if(item.extensions[i].available) buildings.seg.dogs.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.seg.dogs.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.seg.dogs.onBuild ++;
                            break;
                        case "Abrollbehälter-Stellplatz":
                            if(item.extensions[i].available) item.small_building ? buildings.fire.small.ab.build ++ : buildings.fire.normal.ab.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) item.small_building ? buildings.fire.small.ab.onBuild ++ : buildings.fire.normal.ab.onBuild ++;
                            break;
                        case "2. Zug der 1. Hundertschaft":
                            if(item.extensions[i].available) buildings.bepo.division.second.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.bepo.division.second.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.bepo.division.second.onBuild ++;
                            break;
                        case "3. Zug der 1. Hundertschaft":
                            if(item.extensions[i].available) buildings.bepo.division.third.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.bepo.division.third.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.bepo.division.third.onBuild ++;
                            break;
                        case "Sonderfahrzeug: Gefangenenkraftwagen":
                            if(item.extensions[i].available) buildings.bepo.mobilePrison.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.bepo.mobilePrison.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.bepo.mobilePrison.onBuild ++;
                            break;
                        case "Technischer Zug: Wasserwerfer":
                            if(item.extensions[i].available) buildings.bepo.waterthrower.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.bepo.waterthrower.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.bepo.waterthrower.onBuild ++;
                            break;
                        case "SEK: 1. Zug":
                            if(item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.sek.first.build ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.build ++;
                            }
                            if(item.extensions[i].enabled && item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.sek.first.active ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.active ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
                                if(item.building_type == 11) buildings.bepo.sek.first.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.first.onBuild ++;
                            }
                            break;
                        case "SEK: 2. Zug":
                            if(item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.sek.second.build ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.build ++;
                            }
                            if(item.extensions[i].enabled && item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.sek.second.active ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.active ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
                                if(item.building_type == 11) buildings.bepo.sek.second.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.sek.second.onBuild ++;
                            }
                            break;
                        case "MEK: 1. Zug":
                            if(item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.mek.first.build ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.build ++;
                            }
                            if(item.extensions[i].enabled && item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.mek.first.active ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.active ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
                                if(item.building_type == 11) buildings.bepo.mek.first.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.first.onBuild ++;
                            }
                            break;
                        case "MEK: 2. Zug":
                            if(item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.mek.second.build ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.build ++;
                            }
                            if(item.extensions[i].enabled && item.extensions[i].available){
                                if(item.building_type == 11) buildings.bepo.mek.second.active ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.active ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
                                if(item.building_type == 11) buildings.bepo.mek.second.onBuild ++;
                                else if(item.building_type == 17) buildings.polSonder.mek.second.onBuild ++;
                            }
                            break;
                        case "1. Technischer Zug: Bergungsgruppe 2":
                            if(item.extensions[i].available) buildings.thw.firstTz.bg.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.firstTz.bg.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.firstTz.bg.onBuild ++;
                            break;
                        case "1. Technischer Zug: Zugtrupp":
                            if(item.extensions[i].available) buildings.thw.firstTz.zug.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.firstTz.zug.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.firstTz.zug.onBuild ++;
                            break;
                        case "Fachgruppe Räumen":
                            if(item.extensions[i].available) buildings.thw.fgrR.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.fgrR.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.fgrR.onBuild ++;
                            break;
                        case "Fachgruppe Wassergefahren":
                            if(item.extensions[i].available) buildings.thw.fgrW.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.fgrW.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.fgrW.onBuild ++;
                            break;
                        case "2. Technischer Zug - Grundvorraussetzungen":
                            if(item.extensions[i].available) buildings.thw.secondTz.grund.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.secondTz.grund.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.secondTz.grund.onBuild ++;
                            break;
                        case "2. Technischer Zug: Bergungsgruppe 2":
                            if(item.extensions[i].available) buildings.thw.secondTz.bg.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.secondTz.bg.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.secondTz.bg.onBuild ++;
                            break;
                        case "2. Technischer Zug: Zugtrupp":
                            if(item.extensions[i].available) buildings.thw.secondTz.zug.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.secondTz.zug.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.secondTz.zug.onBuild ++;
                            break;
                        case "Fachgruppe Ortung":
                            if(item.extensions[i].available) buildings.thw.fgrO.build ++;
                            if(item.extensions[i].enabled && item.extensions[i].available) buildings.thw.fgrO.active ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.thw.fgrO.onBuild ++;
                            break;
                        case "Allgemeine Innere":
                            if(item.extensions[i].available) buildings.hospital.extension.ina.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.ina.onBuild ++;
                            break;
                        case "Allgemeine Chirurgie":
                            if(item.extensions[i].available) buildings.hospital.extension.ach.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.ach.onBuild ++;
                            break;
                        case "Gynäkologie":
                            if(item.extensions[i].available) buildings.hospital.extension.gyn.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.gyn.onBuild ++;
                            break;
                        case "Urologie":
                            if(item.extensions[i].available) buildings.hospital.extension.uro.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.uro.onBuild ++;
                            break;
                        case "Unfallchirurgie":
                            if(item.extensions[i].available) buildings.hospital.extension.uch.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.uch.onBuild ++;
                            break;
                        case "Neurologie":
                            if(item.extensions[i].available) buildings.hospital.extension.nrl.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.nrl.onBuild ++;
                            break;
                        case "Neurochirurgie":
                            if(item.extensions[i].available) if(item.extensions[i].available) buildings.hospital.extension.nch.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.nch.onBuild ++;
                            break;
                        case "Kardiologie":
                            if(item.extensions[i].available) buildings.hospital.extension.kar.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.kar.onBuild ++;
                            break;
                        case "Kardiochirurgie":
                            if(item.extensions[i].available) buildings.hospital.extension.kch.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) buildings.hospital.extension.kch.onBuild ++;
                            break;
                        case "Zelle":
                            if(item.extensions[i].available) item.small_building ? buildings.police.small.cell.build ++ : buildings.police.normal.cell.build ++;
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild) item.small_building ? buildings.police.small.cell.onBuild ++ : buildings.police.normal.cell.onBuild ++;
                            break;
                        case "Weiterer Klassenraum":
                            if(item.extensions[i].available){
                                if(item.building_type == 1) buildings.school.fire.rooms.build ++;
                                else if(item.building_type == 3) buildings.school.rescue.rooms.build ++;
                                else if(item.building_type == 8) buildings.school.police.rooms.build ++;
                                else if(item.building_type == 10) buildings.school.thw.rooms.build ++;
                            }
                            if(!item.extensions[i].available && item.extensions[i].enabled && showOnBuild){
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

        $('#tableStatusLabel').html(`<div class="pull-right">Statistik ${creditsDatabase.user_name} (${creditsDatabase.user_id})<span style="margin-left:4em"></span>
                                     Toplist-Platz: ${creditsDatabase.user_toplist_position.toLocaleString()}</div>`);

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

        function infoContentMax(name, valueNow, valueMax){
            userInfos += `<tr>
                          <td class="col">${name}</td>
                          <td class="col-1"><center>${valueNow == 0 ? `<span style="color:red">${valueNow.toLocaleString()}</span>` : valueNow < valueMax ?
                                                                      `<span style="color:orange">${valueNow.toLocaleString()}</span>` :
                                                                      `<span style="color:limegreen">${valueNow.toLocaleString()}</span>`} / ${valueMax.toLocaleString()}</center></td>
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

        var displayName = "";

        infoContentOneValue("Fahrzeuge", vehicleDatabaseFms.length);

        if(buildings.helicopter.rescue.count == 0) infoContentMax(`<div style="margin-left:1em">Rettungshubschrauber (RTH)</div>`, vehicles.rth, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);

        if(buildings.helicopter.police.count == 0) infoContentMax(`<div style="margin-left:1em">Polizeihubschrauber</div>`, vehicles.polHeli, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);

        isNaN(preferences.dropdown.dispatchCenter.id) ? infoContentOneValue("Gebäude", buildingsDatabase.length) : infoContentMax("Gebäude", infoBuildingsDatabase.length - buildings.dispatchCenter, buildingsDatabase.length);

        infoContentMax(`<div style="margin-left:1em">Leitstellen</div>`, buildings.dispatchCenter, Math.ceil(buildingsDatabase.length / 25) > 0 ? Math.ceil(buildingsDatabase.length / 25) : 1);

        if(buildings.stagingArea > 0) infoContentOneValue(`<div style="margin-left:1em">Bereitstellungsräume (BSR)</div>`, buildings.stagingArea);

        if(buildings.fire.small.count > 0) infoContentOneValue(`<div style="margin-left:1em">Feuerwachen (klein)</div>`, buildings.fire.small.count);
        if(buildings.fire.small.ab.build > 0 || buildings.fire.small.ab.onBuild > 0){
            displayName = `${configTable.arrowFire} AB-Stellplätze`;
            if(buildings.fire.small.ab.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.small.ab.build, buildings.fire.small.count * 2, buildings.fire.small.ab.onBuild);
            else infoContentMax(displayName, buildings.fire.small.ab.build, buildings.fire.small.count * 2);
        }

        if(buildings.fire.normal.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Feuerwachen</div>`, buildings.fire.normal.count);
            displayName = `${configTable.arrowFire} Großwache`;
            if(buildings.fire.normal.big.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.big.build, Math.floor((buildings.fire.normal.count + buildings.fire.small.count) / 10), buildings.fire.normal.big.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.big.build, Math.floor((buildings.fire.normal.count + buildings.fire.small.count) / 10));
        }
        if(buildings.fire.normal.rescue.build > 0 || buildings.fire.normal.rescue.onBuild > 0){
            displayName = `${configTable.arrowFire} Rettungsdienst-Erweiterung`;
            if(buildings.fire.normal.rescue.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.rescue.active, buildings.fire.normal.rescue.build, buildings.fire.normal.rescue.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.rescue.active, buildings.fire.normal.rescue.build);
            if(buildings.rescue.normal == 0 && buildings.rescue.small == 0){
                if(user_premium ? buildings.fire.normal.rescue.active > 15 : buildings.fire.normal.rescue.active > 20){
                    infoContentMax(`<div class="glyphicon glyphicon-arrow-right" style="margin-left:3em;color:orangered"></div> Großraumrettungswagen (GRTW)`, vehicles.grtw, user_premium ? Math.floor(buildings.fire.normal.rescue.active / 15) : Math.floor(buildings.fire.normal.rescue.active / 20));
                }
                infoContentMax(`<div class="glyphicon glyphicon-arrow-right" style="margin-left:3em;color:orangered"></div> Notarztwagen (NAW)`, vehicles.naw, buildings.fire.normal.rescue.active);
            }
        }
        if(buildings.fire.normal.wr.build > 0 || buildings.fire.normal.wr.onBuild > 0){
            displayName = `${configTable.arrowFire} Wasserrettungs-Erweiterung`;
            if(buildings.fire.normal.wr.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.wr.active, buildings.fire.normal.wr.build, buildings.fire.normal.wr.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.wr.active, buildings.fire.normal.wr.build);
        }
        if(buildings.fire.normal.airport.build > 0 || buildings.fire.normal.airport.onBuild > 0){
            displayName = `${configTable.arrowFire} Flughafen-Erweiterung`;
            if(buildings.fire.normal.airport.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.airport.active, buildings.fire.normal.airport.build, buildings.fire.normal.airport.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.airport.active, buildings.fire.normal.airport.build);
        }
        if(buildings.fire.normal.industry.build > 0 || buildings.fire.normal.industry.onBuild > 0){
            displayName = `${configTable.arrowFire} Werkfeuerwehr`;
            if(buildings.fire.normal.industry.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.industry.active, buildings.fire.normal.industry.build, buildings.fire.normal.industry.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.industry.active, buildings.fire.normal.industry.build);
        }
        if(buildings.fire.normal.ab.build > 0 || buildings.fire.normal.ab.onBuild > 0){
            displayName = `${configTable.arrowFire} AB-Stellplätze`;
            if(buildings.fire.normal.ab.onBuild > 0) infoContentOnBuild(displayName, buildings.fire.normal.ab.build, buildings.fire.normal.count * 9, buildings.fire.normal.ab.onBuild);
            else infoContentMax(displayName, buildings.fire.normal.ab.build, buildings.fire.normal.count * 9);
        }

        if(buildings.school.fire.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Feuerwehrschulen</div>`, buildings.school.fire.count);
            displayName = `${configTable.arrowFire} Klassenräume`;
            if(buildings.school.fire.rooms.onBuild > 0) infoContentOnBuild(displayName, buildings.school.fire.rooms.build + buildings.school.fire.count, buildings.school.fire.count * 4, buildings.school.fire.rooms.onBuild);
            else infoContentMax(displayName, buildings.school.fire.rooms.build + buildings.school.fire.count, buildings.school.fire.count * 4);
        }

        if(buildings.rescue.small > 0){
            infoContentOneValue(`<div style="margin-left:1em">Rettungswachen (klein)</div>`, buildings.rescue.small);
            if(buildings.rescue.normal == 0){
                if(user_premium ? (buildings.rescue.small + buildings.fire.normal.rescue.active) > 15 : (buildings.rescue.small + buildings.fire.normal.rescue.active) > 20){
                    infoContentMax(`${configTable.arrowRescue} Großraumrettungswagen (GRTW)`, vehicles.grtw, user_premium ? Math.floor((buildings.rescue.small + buildings.fire.normal.rescue.active) / 15) : Math.floor((buildings.rescue.small + buildings.fire.normal.rescue.active) / 20));
                }
                infoContentMax(`${configTable.arrowRescue} Notarztwagen (NAW)`, vehicles.naw, (buildings.rescue.small + buildings.fire.normal.rescue.active));
            }
        }

        if(buildings.rescue.normal > 0){
            infoContentOneValue(`<div style="margin-left:1em">Rettungswachen</div>`, buildings.rescue.normal);
            if(user_premium ? (buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active) > 15 : (buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active) > 20){
                infoContentMax(`${configTable.arrowRescue} Großraumrettungswagen (GRTW)`, vehicles.grtw, user_premium ? Math.floor((buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active) / 15) : Math.floor((buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active) / 20));
            }
            infoContentMax(`${configTable.arrowRescue} Notarztwagen (NAW)`, vehicles.naw, (buildings.rescue.normal + buildings.rescue.small + buildings.fire.normal.rescue.active));
        }

        if(buildings.seg.count > 0) infoContentOneValue(`<div style="margin-left:1em">Schnelleinsatzgruppen (SEG)</div>`, buildings.seg.count);
        if(buildings.seg.leader.build > 0 || buildings.seg.leader.onBuild > 0){
            displayName = `${configTable.arrowRescue} Führung`;
            if(buildings.seg.leader.onBuild > 0) infoContentOnBuild(displayName, buildings.seg.leader.active, buildings.seg.leader.build, buildings.seg.leader.onBuild);
            else infoContentMax(displayName, buildings.seg.leader.active, buildings.seg.leader.build);
        }
        if(buildings.seg.sanD.build > 0 || buildings.seg.sanD.onBuild > 0){
            displayName = `${configTable.arrowRescue} Sanitätsdienst`;
            if(buildings.seg.sanD.onBuild > 0) infoContentOnBuild(displayName, buildings.seg.sanD.active, buildings.seg.sanD.build, buildings.seg.sanD.onBuild);
            else infoContentMax(displayName, buildings.seg.sanD.active, buildings.seg.sanD.build);
        }
        if(buildings.seg.wr.build > 0 || buildings.seg.wr.onBuild > 0){
            displayName = `${configTable.arrowRescue} Wasserrettungs-Erweiterung`;
            if(buildings.seg.wr.onBuild > 0) infoContentOnBuild(displayName, buildings.seg.wr.active, buildings.seg.wr.build, buildings.seg.wr.onBuild);
            else infoContentMax(displayName, buildings.seg.wr.active, buildings.seg.wr.build);
        }
        if(buildings.seg.dogs.build > 0 || buildings.seg.dogs.onBuild > 0){
            displayName = `${configTable.arrowRescue} Rettungshundestaffel`;
            if(buildings.seg.dogs.onBuild > 0) infoContentOnBuild(displayName, buildings.seg.dogs.active, buildings.seg.dogs.build, buildings.seg.dogs.onBuild);
            else infoContentMax(displayName, buildings.seg.dogs.active, buildings.seg.dogs.build);
        }

        if(buildings.wr.count > 0 || buildings.wr.active > 0) infoContentMax(`<div style="margin-left:1em">Wasserrettungswachen</div>`, buildings.wr.active, buildings.wr.count + buildings.wr.active);

        if(buildings.rescueDogs.count > 0 || buildings.rescueDogs.active > 0) infoContentMax(`<div style="margin-left:1em">Rettungshundestaffeln</div>`, buildings.rescueDogs.active, buildings.rescueDogs.count + buildings.rescueDogs.active);

        if(buildings.helicopter.rescue.count > 0){
            infoContentMax(`<div style="margin-left:1em">Rettungshubschrauber-Stationen</div>`, buildings.helicopter.rescue.active, buildings.helicopter.rescue.count);
            infoContentMax(`${configTable.arrowRescue} Rettungshubschrauber (RTH)`, vehicles.rth, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);
        }

        if(buildings.school.rescue.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Rettungsdienstschulen</div>`, buildings.school.rescue.count);
            displayName = `${configTable.arrowRescue} Klassenräume`;
            if(buildings.school.rescue.rooms.onBuild > 0) infoContentOnBuild(displayName, buildings.school.rescue.rooms.build + buildings.school.rescue.count, buildings.school.rescue.count * 4, buildings.school.rescue.rooms.onBuild);
            else infoContentMax(displayName, buildings.school.rescue.rooms.build + buildings.school.rescue.count, buildings.school.rescue.count * 4);
        }

        if(buildings.police.small.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Polizeiwachen (klein)</div>`, buildings.police.small.count);
            displayName = `${configTable.arrowPolice} Zellen`;
            if(buildings.police.small.cell.onBuild > 0) infoContentOnBuild(displayName, buildings.police.small.cell.build, buildings.police.small.count * 2, buildings.police.small.cell.onBuild);
            else infoContentMax(displayName, buildings.police.small.cell.build, buildings.police.small.count * 2);
        }

        if(buildings.police.normal.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Polizeiwachen</div>`, buildings.police.normal.count);
            displayName = `${configTable.arrowPolice} Zellen`;
            if(buildings.police.normal.cell.onBuild > 0) infoContentOnBuild(displayName, buildings.police.normal.cell.build, buildings.police.normal.count * 10, buildings.police.normal.cell.onBuild);
            else infoContentMax(displayName, buildings.police.normal.cell.build, buildings.police.normal.count * 10);
        }

        if(buildings.bepo.count > 0) infoContentOneValue(`<div style="margin-left:1em">Bereitschaftspolizei</div>`, buildings.bepo.count);
        if(buildings.bepo.division.second.build > 0 || buildings.bepo.division.second.onBuild > 0){
            displayName = `${configTable.arrowPolice} 2. Zug der 1. Hundertschaft`;
            if(buildings.bepo.division.second.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.division.second.active, buildings.bepo.division.second.build, buildings.bepo.division.second.onBuild);
            else infoContentMax(displayName, buildings.bepo.division.second.active, buildings.bepo.division.second.build);
        }
        if(buildings.bepo.division.third.build > 0 || buildings.bepo.division.third.onBuild > 0){
            displayName = `${configTable.arrowPolice} 3. Zug der 1. Hundertschaft`;
            if(buildings.bepo.division.third.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.division.third.active, buildings.bepo.division.third.build, buildings.bepo.division.third.onBuild);
            else infoContentMax(displayName, buildings.bepo.division.third.active, buildings.bepo.division.third.build);
        }
        if(buildings.bepo.mobilePrison.build > 0 || buildings.bepo.mobilePrison.onBuild > 0){
            displayName = `${configTable.arrowPolice} Sonderfahrzeug: Gefangenenkraftwagen`;
            if(buildings.bepo.mobilePrison.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.mobilePrison.active, buildings.bepo.mobilePrison.build ,buildings.bepo.mobilePrison.onBuild);
            else infoContentMax(displayName, buildings.bepo.mobilePrison.active, buildings.bepo.mobilePrison.build);
        }
        if(buildings.bepo.waterthrower.build > 0 || buildings.bepo.waterthrower.onBuild > 0){
            displayName = `${configTable.arrowPolice} Technischer Zug: Wasserwerfer`;
            if(buildings.bepo.waterthrower.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.waterthrower.active, buildings.bepo.waterthrower.build ,buildings.bepo.waterthrower.onBuild);
            else infoContentMax(displayName, buildings.bepo.waterthrower.active, buildings.bepo.waterthrower.build);
        }
        if(buildings.bepo.sek.first.build > 0 || buildings.bepo.sek.first.onBuild > 0){
            displayName = `${configTable.arrowPolice} SEK: 1. Zug`;
            if(buildings.bepo.sek.first.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.sek.first.active, buildings.bepo.sek.first.build ,buildings.bepo.sek.first.onBuild);
            else infoContentMax(displayName, buildings.bepo.sek.first.active, buildings.bepo.sek.first.build);
        }
        if(buildings.bepo.sek.second.build > 0 || buildings.bepo.sek.second.onBuild > 0){
            displayName = `${configTable.arrowPolice} SEK: 2. Zug`;
            if(buildings.bepo.sek.second.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.sek.second.active, buildings.bepo.sek.second.build ,buildings.bepo.sek.second.onBuild);
            else infoContentMax(displayName, buildings.bepo.sek.second.active, buildings.bepo.sek.second.build);
        }
        if(buildings.bepo.mek.first.build > 0 || buildings.bepo.mek.first.onBuild > 0){
            displayName = `${configTable.arrowPolice} MEK: 1. Zug`;
            if(buildings.bepo.mek.first.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.mek.first.active, buildings.bepo.mek.first.build ,buildings.bepo.mek.first.onBuild);
            else infoContentMax(displayName, buildings.bepo.mek.first.active, buildings.bepo.mek.first.build);
        }
        if(buildings.bepo.mek.second.build > 0 || buildings.bepo.mek.second.onBuild > 0){
            displayName = `${configTable.arrowPolice} MEK: 2. Zug`;
            if(buildings.bepo.mek.second.onBuild > 0) infoContentOnBuild(displayName, buildings.bepo.mek.second.active, buildings.bepo.mek.second.build ,buildings.bepo.mek.second.onBuild);
            else infoContentMax(displayName, buildings.bepo.mek.second.active, buildings.bepo.mek.second.build);
        }

        if(buildings.polSonder.count > 0) infoContentOneValue(`<div style="margin-left:1em">Polizei-Sondereinheiten</div>`, buildings.polSonder.count);
        if(buildings.polSonder.sek.first.build > 0 || buildings.polSonder.sek.first.onBuild > 0){
            displayName = `${configTable.arrowPolice} SEK: 1. Zug`;
            if(buildings.polSonder.sek.first.onBuild > 0) infoContentOnBuild(displayName, buildings.polSonder.sek.first.active, buildings.polSonder.sek.first.build ,buildings.polSonder.sek.first.onBuild);
            else infoContentMax(displayName, buildings.polSonder.sek.first.active, buildings.polSonder.sek.first.build);
        }
        if(buildings.polSonder.sek.second.build > 0 || buildings.polSonder.sek.second.onBuild > 0){
            displayName = `${configTable.arrowPolice} SEK: 2. Zug`;
            if(buildings.polSonder.sek.second.onBuild > 0) infoContentOnBuild(displayName, buildings.polSonder.sek.second.active, buildings.polSonder.sek.second.build ,buildings.polSonder.sek.second.onBuild);
            else infoContentMax(displayName, buildings.polSonder.sek.second.active, buildings.polSonder.sek.second.build);
        }
        if(buildings.polSonder.mek.first.build > 0 || buildings.polSonder.mek.first.onBuild > 0){
            displayName = `${configTable.arrowPolice} MEK: 1. Zug`;
            if(buildings.polSonder.mek.first.onBuild > 0) infoContentOnBuild(displayName, buildings.polSonder.mek.first.active, buildings.polSonder.mek.first.build ,buildings.polSonder.mek.first.onBuild);
            else infoContentMax(displayName, buildings.polSonder.mek.first.active, buildings.polSonder.mek.first.build);
        }
        if(buildings.polSonder.mek.second.build > 0 || buildings.polSonder.mek.second.onBuild > 0){
            displayName = `${configTable.arrowPolice} MEK: 2. Zug`;
            if(buildings.polSonder.mek.second.onBuild > 0) infoContentOnBuild(displayName, buildings.polSonder.mek.second.active, buildings.polSonder.mek.second.build ,buildings.polSonder.mek.second.onBuild);
            else infoContentMax(displayName, buildings.polSonder.mek.second.active, buildings.polSonder.mek.second.build);
        }

        if(buildings.helicopter.police.count > 0){
            infoContentMax(`<div style="margin-left:1em">Polizeihubschrauber-Stationen</div>`, buildings.helicopter.police.active, buildings.helicopter.police.count);
            infoContentMax(`${configTable.arrowPolice} Polizeihubschrauber`, vehicles.polHeli, Math.floor(buildingsDatabase.length / 25) > 4 ? Math.floor(buildingsDatabase.length / 25) : 4);
        }

        if(buildings.school.police.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Polizeischulen</div>`, buildings.school.police.count);
            displayName = `${configTable.arrowPolice} Klassenräume`;
            if(buildings.school.police.rooms.onBuild > 0) infoContentOnBuild(displayName, buildings.school.police.rooms.build + buildings.school.police.count, buildings.school.police.count * 4, buildings.school.police.rooms.onBuild);
            else infoContentMax(displayName, buildings.school.police.rooms.build + buildings.school.police.count, buildings.school.police.count * 4);
        }

        if(buildings.thw.count > 0) infoContentOneValue(`<div style="margin-left:1em">THW Ortsverbände</div>`, buildings.thw.count);
        if(buildings.thw.firstTz.bg.build > 0 || buildings.thw.firstTz.bg.onBuild > 0){
            displayName = `${configTable.arrowThw} 1. Technischer Zug: Bergungsgruppe 2`;
            if(buildings.thw.firstTz.bg.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.firstTz.bg.active, buildings.thw.firstTz.bg.build, buildings.thw.firstTz.bg.onBuild);
            else infoContentMax(displayName, buildings.thw.firstTz.bg.active, buildings.thw.firstTz.bg.build);
        }
        if(buildings.thw.firstTz.zug.build > 0 || buildings.thw.firstTz.zug.onBuild > 0){
            displayName = `${configTable.arrowThw} 1. Technischer Zug: Zugtrupp`;
            if(buildings.thw.firstTz.zug.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.firstTz.zug.active, buildings.thw.firstTz.zug.build, buildings.thw.firstTz.zug.onBuild);
            else infoContentMax(displayName, buildings.thw.firstTz.zug.active, buildings.thw.firstTz.zug.build);
        }
        if(buildings.thw.fgrR.build > 0 || buildings.thw.fgrR.onBuild > 0){
            displayName = `${configTable.arrowThw} Fachgruppe Räumen`;
            if(buildings.thw.fgrR.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.fgrR.active, buildings.thw.fgrR.build, buildings.thw.fgrR.onBuild);
            else infoContentMax(displayName, buildings.thw.fgrR.active, buildings.thw.fgrR.build);
        }
        if(buildings.thw.fgrW.build > 0 || buildings.thw.fgrW.onBuild > 0){
            displayName = `${configTable.arrowThw} Fachgruppe Wassergefahren`;
            if(buildings.thw.fgrW.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.fgrW.active, buildings.thw.fgrW.build, buildings.thw.fgrW.onBuild);
            else infoContentMax(displayName, buildings.thw.fgrW.active, buildings.thw.fgrW.build);
        }
        if(buildings.thw.secondTz.grund.build > 0 || buildings.thw.secondTz.grund.onBuild > 0){
            displayName = `${configTable.arrowThw} 2. Technischer Zug: Grundvoraussetzungen`;
            if(buildings.thw.secondTz.grund.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.secondTz.grund.active, buildings.thw.secondTz.grund.build, buildings.thw.secondTz.grund.onBuild);
            else infoContentMax(displayName, buildings.thw.secondTz.grund.active, buildings.thw.secondTz.grund.build);
        }
        if(buildings.thw.secondTz.bg.build > 0 || buildings.thw.secondTz.bg.onBuild > 0){
            displayName = `${configTable.arrowThw} 2. Technischer Zug: Bergungsgruppe 2`;
            if(buildings.thw.secondTz.bg.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.secondTz.bg.active, buildings.thw.secondTz.bg.build, buildings.thw.secondTz.bg.onBuild);
            else infoContentMax(displayName, buildings.thw.secondTz.bg.active, buildings.thw.secondTz.bg.build);
        }
        if(buildings.thw.secondTz.zug.build > 0 || buildings.thw.secondTz.zug.onBuild > 0){
            displayName = `${configTable.arrowThw} 2. Technischer Zug: Zugtrupp`;
            if(buildings.thw.secondTz.zug.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.secondTz.zug.active, buildings.thw.secondTz.zug.build, buildings.thw.secondTz.zug.onBuild);
            else infoContentMax(displayName, buildings.thw.secondTz.zug.active, buildings.thw.secondTz.zug.build);
        }
        if(buildings.thw.fgrO.build > 0 || buildings.thw.fgrO.onBuild > 0){
            displayName = `${configTable.arrowThw} Fachgruppe Ortung`;
            if(buildings.thw.fgrO.onBuild > 0) infoContentOnBuild(displayName, buildings.thw.fgrO.active, buildings.thw.fgrO.build, buildings.thw.fgrO.onBuild);
            else infoContentMax(displayName, buildings.thw.fgrO.active, buildings.thw.fgrO.build);
        }

        if(buildings.school.thw.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">THW Bundesschulen</div>`, buildings.school.thw.count);
            displayName = `${configTable.arrowThw} Klassenräume`;
            if(buildings.school.thw.rooms.onBuild > 0) infoContentOnBuild(displayName, buildings.school.thw.rooms.build + buildings.school.thw.count, buildings.school.thw.count * 4, buildings.school.thw.rooms.onBuild);
            else infoContentMax(displayName, buildings.school.thw.rooms.build + buildings.school.thw.count, buildings.school.thw.count * 4);
        }

        if(buildings.hospital.count > 0){
            infoContentOneValue(`<div style="margin-left:1em">Krankenhäuser</div>`, buildings.hospital.count);
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

    $("body").on("click", "#vehicleManagement", function(){
        $('#filterDispatchCenter').html(`<option selected>wird geladen ...</option>`);
        $('#filterType').html(`<option selected>wird geladen ...</option>`);
        $('#tableStatusLabel').html('');
        $('#tableStatusBody').html('');
        preferences.status.count = 0;
        getBuildingTypeId.length = 0;
        getBuildingName.length = 0;
        getBuildingsOnDispatchCenter.length = 0;
        loadApi();
        setTimeout(function(){
            var dropdown = {"dispatchCenter":`<option selected>alle Leitstellen</option>`,
                            "vehicleTypes":`<option selected>alle Fahrzeugtypen</option>`
                           };
            var dropdownDatabase = [];
            var dropdownOwnClass = [];
            $.each(buildingsDatabase, function(key, item){
                if(item.building_type == 7){
                    dropdown.dispatchCenter += `<option value="${item.id}">${item.caption}</option>"`;
                }
            });
            $.each(vehicleDatabase, function(key, item){
                dropdownDatabase.push({"typeId": key, "name": item.name});
            });
            $.each(vehicleDatabaseFms, function(key, item){
                if(item.vehicle_type_caption) dropdownOwnClass.push({"ownClass": item.vehicle_type_caption});
            });
            dropdownDatabase.sort((a, b) => a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1);
            for(let i = 0; i < dropdownDatabase.length; i++){
                dropdown.vehicleTypes += `<option value="${dropdownDatabase[i].typeId}">${dropdownDatabase[i].name}</option>`;
            }
            if(dropdownOwnClass.length > 0){
                if(dropdownOwnClass.length >= 2) dropdownOwnClass.sort((a, b) => a.ownClass.toUpperCase() > b.ownClass.toUpperCase() ? 1 : -1);
                for(let i = 0; i < dropdownOwnClass.length; i++){
                    if(i > 0 && dropdownOwnClass[i].ownClass !== dropdownOwnClass[i - 1].ownClass){
                        dropdown.vehicleTypes += `<option value="-1" data-vehicle="${dropdownOwnClass[i].ownClass}">${dropdownOwnClass[i].ownClass}</option>`;
                    }
                    else if(i == 0) dropdown.vehicleTypes += `<option value="-1" data-vehicle="${dropdownOwnClass[i].ownClass}">${dropdownOwnClass[i].ownClass}</option>`;
                }
            }
            $('#filterDispatchCenter').html(dropdown.dispatchCenter);
            $('#filterType').html(dropdown.vehicleTypes);
            preferences.dropdown.vehicles.type = parseInt($('#filterType').val());
            preferences.dropdown.vehicles.ownClass = $('#filterType').find(':selected').data('vehicle');
            preferences.dropdown.dispatchCenter.id = parseInt($('#filterDispatchCenter').val());
        }, 2000);
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
        preferences.dropdown.dispatchCenter.id = parseInt($('#filterDispatchCenter').val());
        preferences.status.count == 0 ? playerInfos() : createTable(preferences.status.count);
    });

    $("body").on("click", "#filterType", function(){
            preferences.dropdown.vehicles.type = parseInt($('#filterType').val());
            preferences.dropdown.vehicles.ownClass = $('#filterType').find(':selected').data('vehicle');
            if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#sortBy", function(){
        if(preferences.status.count != 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterFw", function(){
        preferences.filter.fire = !preferences.filter.fire;
        $('#filterFw').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterRd", function(){
        preferences.filter.rescue = !preferences.filter.rescue;
        $('#filterRd').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterThw", function(){
        preferences.filter.thw = !preferences.filter.thw;
        $('#filterThw').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterPol", function(){
        preferences.filter.police = !preferences.filter.police;
        $('#filterPol').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterWr", function(){
        preferences.filter.wr = !preferences.filter.wr;
        $('#filterWr').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterHeli", function(){
        preferences.filter.helicopter = !preferences.filter.helicopter;
        $('#filterHeli').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterBp", function(){
        preferences.filter.bepo = !preferences.filter.bepo;
        $('#filterBp').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#filterSeg", function(){
        preferences.filter.seg = !preferences.filter.seg;
        $('#filterSeg').toggleClass("label-success label-danger");
        if(preferences.status.count !== 0) createTable(preferences.status.count);
    });

    $("body").on("click", "#player", function(){
        preferences.status.count = 0;
        playerInfos();
    });

    $("body").on("click", "#complete", function(){
        preferences.status.count = "1 bis 9";
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms1", function(){
        preferences.status.count = 1;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms2", function(){
        preferences.status.count = 2;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms3", function(){
        preferences.status.count = 3;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms4", function(){
        preferences.status.count = 4;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms5", function(){
        preferences.status.count = 5;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms6", function(){
        preferences.status.count = 6;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms7", function(){
        preferences.status.count = 7;
        createTable(preferences.status.count);
    });

    $("body").on("click", "#fms9", function(){
        preferences.status.count = 9;
        createTable(preferences.status.count);
    });

})();
