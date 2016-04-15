/* globals Stats, dat*/

// promises polyfill from the babel team
import 'babel-polyfill';

import HelpersStack      from '../../src/helpers/helpers.stack';
import HelpersVoxel      from '../../src/helpers/helpers.voxel';
import LoadersVolume     from '../../src/loaders/loaders.volume';
import WidgetsVoxelProbe from '../../src/widgets/widgets.voxelProbe';
import ControlsTrackball from '../../src/controls/controls.trackball';

// standard global variables
let controls, renderer, threeD, stats, scene, camera, probe, helpersVoxel, directions, bbox;

let voxelsSettings = {
  color : '#00B0FF',
  showMesh: true,
  showMeasurements: true,
  showSVG: true
};

let widgetSettings = {
  defaultColor : '#00B0FF',
  activeColor : '#FFEB3B',
  hoverColor : '#F50057',
  selectedColor : '#76FF03',
  showMesh: true,
  showMeasurements: true,
  showSVG: true
};

// FUNCTIONS
function buildGUI() {
  // access probe here...

  let gui = new dat.GUI({
            autoPlace: false
          });

  let customContainer = document.getElementById('my-gui-container');
  customContainer.appendChild(gui.domElement);

  let voxelFolder = gui.addFolder('Voxels');
  let color = voxelFolder.addColor(voxelsSettings, 'color');
  color.onChange(function(value) {
    // update all colors...
    for (let i = 0; i < 10; i++) {
      helpersVoxel[i].color = value.replace('#', '0x');
    }
  });
  let showMesh = voxelFolder.add(voxelsSettings, 'showMesh');
  showMesh.onChange(function(value) {
    // update all colors...
    for (let i = 0; i < 10; i++) {
      helpersVoxel[i].showVoxel = value;
    }
  });

  let showMeasurements = voxelFolder.add(voxelsSettings, 'showMeasurements');
  showMeasurements.onChange(function(value) {
    // update all colors...
    for (let i = 0; i < 10; i++) {
      helpersVoxel[i].showDomMeasurements = value;
    }
  });

  let showSVG = voxelFolder.add(voxelsSettings, 'showSVG');
  showSVG.onChange(function(value) {
    // update all colors...
    for (let i = 0; i < 10; i++) {
      helpersVoxel[i].showDomSVG = value;
    }
  });

  // same features for the widget's voxels
  voxelFolder.open();

  let widgetFolder = gui.addFolder('Widget');
  let dColorW = widgetFolder.addColor(widgetSettings, 'defaultColor');
  dColorW.onChange(function(value) {
    probe.defaultColor = value.replace('#', '0x');
  });
  let aColorW = widgetFolder.addColor(widgetSettings, 'activeColor');
  aColorW.onChange(function(value) {
    probe.activeColor = value.replace('#', '0x');
  });
  let hColorW = widgetFolder.addColor(widgetSettings, 'hoverColor');
  hColorW.onChange(function(value) {
    probe.hoverColor = value.replace('#', '0x');
  });
  let sColorW = widgetFolder.addColor(widgetSettings, 'selectedColor');
  sColorW.onChange(function(value) {
    probe.selectedColor = value.replace('#', '0x');
  });

  let showMeshW = widgetFolder.add(widgetSettings, 'showMesh');
  showMeshW.onChange(function(value) {
    probe.showVoxel = value;
  });

  let showMeasurementsW = widgetFolder.add(widgetSettings, 'showMeasurements');
  showMeasurementsW.onChange(function(value) {
    probe.showDomMeasurements = value;
  });

  let showSVGW = widgetFolder.add(widgetSettings, 'showSVG');
  showSVGW.onChange(function(value) {
    probe.showDomSVG = value;
  });
}

function init() {
  // this function is executed on each animation frame
  function animate() {

    // update helpersVoxel doms
    if (helpersVoxel) {
      for (let i = 0; i < 10; i++) {
        // update world coordinates
        if (helpersVoxel[i].voxel.dataCoordinates.x >= bbox.x) {
          directions[i].x = -1;
        } else if (helpersVoxel[i].voxel.dataCoordinates.x <= 0) {
          directions[i].x = 1;
        }

        if (helpersVoxel[i].voxel.dataCoordinates.y >= bbox.y) {
          directions[i].y = -1;
        } else if (helpersVoxel[i].voxel.dataCoordinates.y <= 0) {
          directions[i].y = 1;
        }

        // update world coordinates coordinates
        let nextWorldCoordinate = new THREE.Vector3(
          helpersVoxel[i].voxel.dataCoordinates.x + directions[i].x,
          helpersVoxel[i].voxel.dataCoordinates.y + directions[i].y,
          helpersVoxel[i].voxel.dataCoordinates.z
        );
        nextWorldCoordinate.applyMatrix4(helpersVoxel[i]._stack.ijk2LPS);

        helpersVoxel[i].worldCoordinates = nextWorldCoordinate;

        // then screen stuff
        helpersVoxel[i].updateVoxelScreenCoordinates(camera, threeD);
        helpersVoxel[i].updateDom(threeD);
      }
    }

    // render
    controls.update();
    renderer.render(scene, camera);
    stats.update();

    // request new frame
    requestAnimationFrame(function() {
      animate();
    });
  }

  // renderer
  threeD = document.getElementById('r3d');
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setSize(threeD.offsetWidth, threeD.offsetHeight);
  renderer.setClearColor(0xFFFFFF, 1);

  threeD.appendChild(renderer.domElement);

  // stats
  stats = new Stats();
  threeD.appendChild(stats.domElement);

  // scene
  scene = new THREE.Scene();
  
  // camera
  camera = new THREE.PerspectiveCamera(45, threeD.offsetWidth / threeD.offsetHeight, 1, 10000000);
  camera.position.x = 150;
  camera.position.y = 50;
  camera.position.z = 50;
  // controls
  controls = new ControlsTrackball(camera, threeD);
  controls.rotateSpeed = 1.4;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  animate();
}

window.onload = function() {
  // init threeJS...
  init();

  let file = 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/36749894';

  let loader = new LoadersVolume(threeD);
  // Start off with a promise that always resolves
  let sequence = Promise.resolve();
  sequence
  // fetch the file
  .then(function() {
    return loader.fetch(file);
  })
  .then(function(data) {
    return loader.parse(data);
  })
  .then(function(series) {

    loader.free();
    loader = null;

    let stack = series._stack[0];
    let stackHelper = new HelpersStack(stack);

    scene.add(stackHelper);

    probe = new WidgetsVoxelProbe(stack,
                                  stackHelper.slice.mesh,
                                  controls,
                                  camera,
                                  threeD);
    probe._current._showVoxel =  true;
    probe._current._showDomSVG =  true;
    probe._current._showDomMeasurements =  true;
    scene.add(probe);

    //
    let centerLPS = stack.worldCenter();

    // voxelHelpers
    helpersVoxel = [];
    directions = [];
    for (let i = 0; i < 10; i++) {
      let voxel = new HelpersVoxel(centerLPS, stackHelper.stack);
      voxel.color = voxelsSettings.color.replace('#', '0x');
      voxel.updateVoxelScreenCoordinates(camera, threeD);
      voxel.updateDom(threeD);
      helpersVoxel.push(voxel);

      // voxel direction
      let direction = new THREE.Vector3(
        Math.random() < 0.33 ? -1 : (Math.random() < 0.5 ? 0 : 1),
        Math.random() < 0.33 ? -1 : (Math.random() < 0.5 ? 0 : 1),
        0);
      directions.push(direction);

      // add voxles to the scene
      scene.add(helpersVoxel[i]);
    }

    bbox = stack.dimensionsIJK;

    // update camrea's and interactor's target
    // update camera's target
    camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    controls.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    camera.updateProjectionMatrix();

    // create a GUI to showcase features from the widget
    buildGUI();
  });
};