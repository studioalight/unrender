var THREE = require('three');
var combineOptions = require('./options.js');
var createParticleView = require('./lib/particle-view.js');
var createLineView = require('./lib/line-view.js');
var createHitTest = require('./lib/hit-test.js');
var flyControls = require('three.fly');
var normalizeColor = require('./lib/normalize-color.js');

// Expose three.js as well, so simple clients do not have to require it
unrender.THREE = THREE;

module.exports = unrender;

function unrender(container, options) {
  var api = {
    destroy: destroy,
    scene: getScene,
    camera: getCamera,
    input: getInput,
    renderer: getRenderer,
    particles: particles,
    hitTest: getHitTest,
    highlight: highlight,
    lines: drawLines
  };

  options = combineOptions(options);
  var lastFrame;

  var scene = createScene();
  var camera = createCamera();
  var renderer = createRenderer();
  var particleView = createParticleView(scene);
  var lineView = createLineView(scene);
  var input = createInputHandler();

  // TODO: This doesn't seem to belong here... Not sure where to put it
  var hitTest = createHitTest(particleView, container);

  startEventsListening();

  frame();

  return api;

  function getHitTest() {
    return hitTest;
  }

  function highlight(indexes, color, scale) {
    color = normalizeColor(color);
    if (!color) color = 0xff0000;
    if (typeof scale !== 'number') scale = 1;

    particleView.highlight(indexes, color, scale);
  }

  function createInputHandler() {
    var controls = flyControls(camera, container, THREE);
    controls.movementSpeed = 200;
    controls.rollSpeed = 0.20;

    return controls;
  }

  function frame() {
    lastFrame = requestAnimationFrame(frame);
    renderer.render(scene, camera);
    hitTest.update(scene, camera);
    input.update(0.1);
  }

  function particles(coordinates) {
    if (coordinates === undefined) {
      return particleView.coordinates();
    }

    particleView.render(coordinates);

    if (hitTest) hitTest.destroy();
    hitTest = createHitTest(particleView, container);

    return api;
  }

  function destroy() {
    hitTest.destroy();
    input.destroy();
    stopEventsListening();
    container.removeChild(renderer.domElement);
  }

  function createScene() {
    var scene = new THREE.Scene();
    scene.sortObjects = false;
    return scene;
  }

  function getScene() {
    return scene;
  }

  function createCamera() {
    var camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 20000);
    scene.add(camera);

    return camera;
  }

  function getCamera() {
    return camera;
  }

  function getInput() {
    return input;
  }

  function createRenderer() {
    var renderer = new THREE.WebGLRenderer({
      antialias: false
    });

    renderer.setClearColor(options.clearColor, 1);
    renderer.setSize(container.clientWidth, container.clientHeight);

    container.appendChild(renderer.domElement);
    return renderer;
  }

  function getRenderer() {
    return renderer;
  }

  function startEventsListening() {
    window.addEventListener('resize', onWindowResize, false);
  }


  function stopEventsListening() {
    window.removeEventListener('resize', onWindowResize, false);
    cancelAnimationFrame(lastFrame);
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function drawLines(lines) {
    lineView.draw(lines);
  }
}
