"use strict";
const ipcRenderer = window.ipcRenderer;
const app = window.app;

const JulianDate = Cesium.JulianDate;
const Quaternion = Cesium.Quaternion;
const Cartesian3 = Cesium.Cartesian3;
const Transforms = Cesium.Transforms;
const Matrix3 = Cesium.Matrix3;
const Matrix4 = Cesium.Matrix4;

const defaultClockScale = 100;
const homeCameraView = {
    destination: Cesium.Cartesian3.fromDegrees(136.70510974114885, 36.54389351031144, 20000000)
}

// ビューワー作成
var viewer = new Cesium.Viewer("cesium", {
    terrainProvider: Cesium.createWorldTerrain(),
    shouldAnimate: false,
    baseLayerPicker: false,
    geocoder: false,
    navigationHelpButton: false,
    shadows: true
});

// ビューワー設定
const scene = viewer.scene;
const globe = scene.globe;
viewer._cesiumWidget._creditContainer.parentNode.removeChild(viewer._cesiumWidget._creditContainer);
viewer.resolutionScale = window.devicePixelRatio;
viewer.resolutionScale = window.devicePixelRatio
scene.camera.flyTo(homeCameraView);
globe.showGroundAtmosphere = true;
globe.enableLighting = true;

// レンズフレア
const lensFlare = scene.postProcessStages.add(
    Cesium.PostProcessStageLibrary.createLensFlareStage()
);

lensFlare.enabled = true;
lensFlare.uniforms.intensity = 3;
lensFlare.uniforms.distortion = 5;
lensFlare.uniforms.ghostDispersal = 0.5;
lensFlare.uniforms.haloWidth = 0.5;
lensFlare.uniforms.dirtAmount = 0.3;
lensFlare.uniforms.earthRadius = Cesium.Ellipsoid.WGS84.maximumRadius;

var czml = new Cesium.CzmlDataSource();

// ファイル入力
const satUrl = "../resource/parameter/koyoh_orbit.json";
fetch(satUrl)
    .then(response => response.json())
    .then(data => {
        const qBlockSize = 5;
        const pBlockSize = 4;
        const epoch = JulianDate.fromIso8601(data.orientation.epoch);
        let qIb = data.orientation.unitQuaternion;
        const pos = data.position.cartographicDegrees;
        const dataLength = data.orientation.unitQuaternion.length / qBlockSize;

        // 慣性座標系から地球固定地球中心座標系への変換
        for (let i = 0; i < dataLength; i++) {
            let qp = i * qBlockSize;
            let pp = i * pBlockSize;
            let t_i = JulianDate.addSeconds(epoch, qIb[qp], new JulianDate());
            let qIb_i = new Quaternion(qIb[qp + 1], qIb[qp + 2], qIb[qp + 3], qIb[qp + 4]);
            let qEi_i = Quaternion.fromRotationMatrix(Transforms.computeIcrfToFixedMatrix(t_i)); // ECEFからICRF
            let qEb_i = Quaternion.multiply(qEi_i, qIb_i, new Quaternion());
            qIb[qp + 1] = qEb_i.x;
            qIb[qp + 2] = qEb_i.y;
            qIb[qp + 3] = qEb_i.z;
            qIb[qp + 4] = qEb_i.w;

            // pos[pp + 3] *= 3; // スケールアップ
        }

        var doc = {
            id: "document",
            name: "satelllite",
            version: "1.0",
            clock: {
                interval: "2023-02-15T04:50:00Z/2023-02-16T04:50:00Z",
                currentTime: "2023-02-15T04:50:00Z",
                multiplier: defaultClockScale,
                range: "LOOP_STOP",
                step: "SYSTEM_CLOCK_MULTIPLIER"
            }
        };
        czml.process(doc);
        czml.process(data);
    });

var satelliteEntity = viewer.dataSources.add(czml);

// var gs = {
//     id: "KanazawaUnivGs",
//     name: "KOYOH Ground Station",
//     billboard: {
//         image: "../resource/image/Kanazawa_University_logo.svg",
//         scale: 0.2,
//     },
//     position: Cesium.Cartesian3.fromDegrees(136.70510974114885, 36.54389351031144, 25)
// };

// var groundStationEntity = viewer.entities.add(gs);

var earthCore = {
    id: "core",
    position: Cesium.Cartesian3(0, 0, 0),
    point: { show: false }
};

var earthCoreEntity = viewer.entities.add(earthCore);


viewer.trackedEntity = satelliteEntity;

// ホームボタンの機能変更
viewer.homeButton.viewModel.command.beforeExecute.addEventListener(
    function (e) {
        e.cancel = true;
        scene.camera.flyTo(homeCameraView);
    }
);


addToolbarButton("ICRF view", earthView);
addToolbarButton("ECEF view", satelliteView);

var icrfSelect = false;


const http = require('http');
const fs = require('fs');

var server = http.createServer(
    (request, response) => {
        fs.readFile('./index.html', 'UTF-8', (error, data) => {
            response.writeHead(200, { 'Content-Type': 'text/html' });
            response.write(data);
            response.end();
        })

    }
);
server.listen(3000);

function addToolbarButton(text, onclick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "cesium-button";
    button.onclick = function () {
        onclick();
    };
    button.textContent = text;
    document.getElementById("toolbar").appendChild(button);
}

function satelliteView() {
    // viewer.trackedEntity = undefined;

    if (icrfSelect) {
        scene.postUpdate.removeEventListener(icrfView);
        icrfSelect = false;
    }

    // viewer.trackedEntity = satelliteEntity;
}

function earthView() {
    // viewer.trackedEntity = undefined;

    if (!icrfSelect) {
        scene.postUpdate.addEventListener(icrfView);
    }
    // viewer.trackedEntity = earthCoreEntity;
    // scene.camera.flyTo(homeCameraView);
}

function icrfView(scene, time) {
    if (scene.mode !== Cesium.SceneMode.SCENE3D) {
        return;
    }

    const icrfToFixed = Cesium.Transforms.computeIcrfToFixedMatrix(time);
    if (Cesium.defined(icrfToFixed)) {
        const camera = viewer.camera;
        const offset = Cesium.Cartesian3.clone(camera.position);
        const transform = Cesium.Matrix4.fromRotationTranslation(icrfToFixed);
        camera.lookAtTransform(transform, offset);
    }

    icrfSelect = true;;
}