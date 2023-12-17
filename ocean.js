import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let container, stats;
let camera, scene, renderer;
let controls, water, sun;
let pirateBoatPosition ;

init();
animate();

function init() {
    container = document.getElementById('container');

    container = document.getElementById( 'container' );

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    container.appendChild( renderer.domElement );

    //

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.set(30, 60, 100);
    controls = new OrbitControls( camera, renderer.domElement );
    controls.target.set(0, 10, 0);

    // Increase the movement speed of the controls
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25; // controls damping (higher means lower sensitivity)

    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set( 0, 10, 0 );
    controls.minDistance = 40.0;
    controls.maxDistance = 200.0;
    

    //

    sun = new THREE.Vector3();

    // Water

    const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( 'textures/waternormals.jpg', function ( texture ) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x7ac5d8,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );

    water.rotation.x = - Math.PI / 2;

    scene.add( water );

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar( 10000 );
    scene.add( sky );

    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 10;
    skyUniforms[ 'rayleigh' ].value = 2;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
    skyUniforms[ 'mieDirectionalG' ].value = 0.8;

    const parameters = {
        elevation: 2,
        azimuth: 180
    };

    const pmremGenerator = new THREE.PMREMGenerator( renderer );
    const sceneEnv = new THREE.Scene();

    let renderTarget;

    function updateSun() {

        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
        water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

        if ( renderTarget !== undefined ) renderTarget.dispose();

        sceneEnv.add( sky );
        renderTarget = pmremGenerator.fromScene( sceneEnv );
        scene.add( sky );

        scene.environment = renderTarget.texture;

    }

    updateSun();

    //

// loading Mini boat model 

const loaderMiniBoat = new GLTFLoader();

loaderMiniBoat.load('model/Boat/scene.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    const desiredPosition = new THREE.Vector3(0, 20, 0);

    // Apply the desired position to the loaded model
    gltf.scene.position.copy(desiredPosition);
 // Give the Mini boat a name
 gltf.scene.name = "MiniBoat"; 
    // Add the model to the scene
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});

// Loading Pirate boat 
const loaderPirateBoat = new GLTFLoader();

loaderPirateBoat.load('model/PirateBoat/scene.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    pirateBoatPosition = new THREE.Vector3(1500, 20, 500); // Initial position
    gltf.scene.position.copy(pirateBoatPosition);
// Give the Pirate boat a name
    gltf.scene.name = "PirateBoat"; 
// Adjust the scaling factor as needed
    const desiredScale = 200; 
    gltf.scene.scale.set(desiredScale, desiredScale, desiredScale);

    // Add the model to the scene
    scene.add(gltf.scene);
    // Save the loaded object
    pirateBoat = gltf.scene;
}, undefined, function (error) {
    console.error(error);
});
//////////////////////////////////////////

//Loading whale 1 Model 
const loaderWhale1 = new GLTFLoader();

loaderWhale1.load('model/Whale1/scene.gltf', function (gltf) {
    // Set the desired position ( x ,z , y)
    const desiredPosition = new THREE.Vector3(400, -60, 150);

    // Apply the desired position to the loaded model
    gltf.scene.position.copy(desiredPosition);
 // Give the Mini boat a name
 gltf.scene.name = "Whale1"; 
    // Add the model to the scene
    scene.add(gltf.scene);
}, undefined, function (error) {
    console.error(error);
});
///////////////////////////
    //


    //

    stats = new Stats();
    container.appendChild( stats.dom );

    // GUI

    const gui = new GUI();

    const folderSky = gui.addFolder( 'Sky' );
    folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
    folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
    folderSky.open();

    const waterUniforms = water.material.uniforms;

    const folderWater = gui.addFolder( 'Water' );
    folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
    folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
    folderWater.open();


    //

    window.addEventListener( 'resize', onWindowResize );


    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    // Update controls and render the scene
    PirateBoatMovement();
    WhaleMovement();
    controls.update();
    render();
    stats.update();
}

function WhaleMovement() {
    // Find the Whale1 object in the scene
    const whale1 = scene.getObjectByName("Whale1");

    if (whale1) {
        // Adjust the movement ranges and speeds as needed
        const horizontalMovementRange = 800; // How far the whale should move horizontally
        const verticalMovementRange = -50; // How far the whale should move up and down
        const horizontalMovementSpeed = 0.00015; // Adjust the speed of horizontal movement
        const verticalMovementSpeed = 0.001; // Adjust the speed of vertical movement

        // Calculate the horizontal movement based on sine function
        const horizontalMovement = horizontalMovementRange * Math.sin(performance.now() * horizontalMovementSpeed);

        // Calculate the vertical movement based on sine function
        const verticalMovement = verticalMovementRange * Math.sin(performance.now() * verticalMovementSpeed);

        // Set the new position for the Whale1 object
        whale1.position.set(500, verticalMovement, horizontalMovement);
    } else {
        console.error("Whale1 not found in the scene or not loaded yet.");
    }
}



function PirateBoatMovement() {
    // Animate Pirate boat's position in a circle around MiniBoat
    const speed = 0.0001; // Adjust the speed of movement
    const radius = 1500; // Adjust the radius of the circle

    // Get the position you want to circle about
    const CircleAroundPosition = scene.getObjectByName("MiniBoat").position;

    // Calculate new position in a circular path around MiniBoat
    const angle = -speed * performance.now();
    const newX = CircleAroundPosition.x + radius * Math.cos(angle);
    const newZ = CircleAroundPosition.z + radius * Math.sin(angle);

    // Update the Pirate boat's position
    const pirateBoat = scene.getObjectByName("PirateBoat");
    if (pirateBoat) {
        pirateBoat.position.set(newX, pirateBoatPosition.y, newZ);
        // Update the rotation to face towards the center
        const directionToCenter = new THREE.Vector3(CircleAroundPosition.x - newX, 0, CircleAroundPosition.z - newZ);
        pirateBoat.lookAt(CircleAroundPosition);
    } else {
        console.error("Pirate boat not found in the scene or not loaded yet.");
    }
}



function render() {
    const time = performance.now() * 0.001;
    water.material.uniforms['time'].value += 1.0 / 60.0;
    renderer.render(scene, camera);
}
