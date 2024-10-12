import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AmbientLight, lightingContext } from 'three/webgpu';
import { exp } from 'three/webgpu';

let camera, scene, renderer, bulbLight, bulbMat, middlelineMate, middleLine, hemiLight, sidesLight, sidesMate, userPaddel, userPaddelmate, opPaddel, opPaddelmate, stats;
let floorMat;
let moveLeft = false;
let moveRight = false;

const userPaddel1 = {
	posX: 9,
	posY: 0.2,
	posZ: 0,
	geoX: 0.3,
	geoY: 0.4,
	geoZ: 2
}

let previousShadowMap = false;

const padelsLuminousPowers = {
	'110000 lm (1000W)': 110000,
	'3500 lm (300W)': 3500,
	'1700 lm (100W)': 1700,
	'800 lm (60W)': 800,
	'400 lm (40W)': 400,
	'180 lm (25W)': 180,
	'20 lm (4W)': 20,
	'Off': 0
}

const bulbLuminousPowers = {
	'110000 lm (1000W)': 110000,
	'3500 lm (300W)': 3500,
	'1700 lm (100W)': 1700,
	'800 lm (60W)': 800,
	'400 lm (40W)': 400,
	'180 lm (25W)': 180,
	'20 lm (4W)': 20,
	'Off': 0
};

const sidesLuminousPower = {
	'110000 lm (1000W)': 110000,
	'3500 lm (300W)': 3500,
	'1700 lm (100W)': 1700,
	'800 lm (60W)': 800,
	'400 lm (40W)': 400,
	'180 lm (25W)': 180,
	'20 lm (4W)': 20,
	'Off': 0
};

const hemiLuminousIrradiances = {
	'0.0001 lx (dlam)': 0.0001,
	'0.002 lx (shwya dyl dlam)': 0.002,
	'0.5 lx (shwya dyl dow)': 0.5,
	'3.4 lx (bola 9tissadya)': 3.4,
	'50 lx (bola zayda shwya)': 50,
	'100 lx (bola original)': 100,
	'350 lx (bzaf shwya dyl do)': 350,
	'400 lx (9amar mdaawi)': 400,
	'1000 lx (festival dyal do)': 1000,
	'18000 lx (do dyal lah)': 18000,
	'50000 lx (benguerir fsif)': 50000
};

//default params
const params = {
	shadows: true,
	exposure: 0.5,
	bulbPower: Object.keys(bulbLuminousPowers)[4],
	hemiIrradiance: Object.keys(hemiLuminousIrradiances)[2],
	sidesPower: Object.keys(sidesLuminousPower)[4],
	padelsPower: Object.keys(padelsLuminousPowers)[4]
};

init();

function init() {
	const container = document.getElementById('container');

	//stats settings(fps, ms)
	stats = new Stats();
	container.appendChild(stats.dom);

	//camera settings
	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
	camera.position.x = 20;
	camera.position.z = 4;
	camera.position.y = 8;

	scene = new THREE.Scene();

	//light kora settings
	const bulbGeometry = new THREE.SphereGeometry(0.15, 64, 64);
	bulbLight = new THREE.PointLight(0xffffff, 10, 0, 0.75);
	bulbMat = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		emissive: 0xffffff,
		emissiveIntensity: 5,
		metalness: 0,
		roughness: 0,
		reflectivity: 3,
	});
	bulbLight.add(new THREE.Mesh(bulbGeometry, bulbMat));
	bulbLight.position.set(0, 0, 0);
	bulbLight.castShadow = false;
	scene.add(bulbLight);

	//floor light settings
	hemiLight = new THREE.HemisphereLight(0xffffff, 0x0f0e0d, 1);
	scene.add(hemiLight);
	floorMat = new THREE.MeshStandardMaterial({
		roughness: 3,
		color: 0x008080,
		metalness: 0.5,
		bumpScale: 1,
		transparent: true,
		opacity: 10,
	});

	//insert 3D num models

	const floorGeometry = new THREE.PlaneGeometry(200, 100);
	const floorMesh = new THREE.Mesh(floorGeometry, floorMat);
	floorMesh.receiveShadow = true;
	floorMesh.rotation.x = -Math.PI / 2.0;
	scene.add(floorMesh);

	//texture n9dr n7ydo wla nbdlo ma3rt
	const textureLoader = new THREE.TextureLoader();
	textureLoader.load('models/space.jpg', function (texture) {
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(1, 1);
		floorMat.map = texture;
		floorMat.needsUpdate = true;
	});

	//middle line settings
	const middleLineGeometry = new THREE.BufferGeometry();
	const linePoints = [
	new THREE.Vector3(0, 0.01, -5),
	new THREE.Vector3(0, 0.01, 5)
	];
	middleLineGeometry.setFromPoints(linePoints);
	middlelineMate = new THREE.LineDashedMaterial({
		color: 0xffffff,
		dashSize: 0.5,
		gapSize: 0.2,
		linewidth: 10,
	  });
	middleLine = new THREE.Line(middleLineGeometry, middlelineMate);
	middleLine.computeLineDistances();
	middleLine.position.set(0, 0, 0);
	scene.add(middleLine);

	//sides light settings
	const sidesGeometry = new THREE.BoxGeometry(20, 0.2, 0.5);
	sidesLight =  new THREE.AmbientLight(0xffffff, 1);
	sidesMate = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		emissive: 0xff0000,
		glowness: 1,
		emissiveIntensity: 1.5,
		metalness: 0.9,
		roughness: 0.09,
	  });
	sidesLight.add(new THREE.Mesh(sidesGeometry, sidesMate));
	sidesLight.position.set(0, 0.1, 5);
	sidesLight.castShadow = false;
	scene.add(sidesLight);

	//other sides
	const sidesGeometry2 = new THREE.BoxGeometry(20, 0.2, 0.5);
	sidesLight =  new THREE.AmbientLight(10, 100, 2);
	sidesLight.add(new THREE.Mesh(sidesGeometry2, sidesMate));
	sidesLight.position.set(0, 0.1, -5);
	scene.add(sidesLight);
	
	//padel
	const padelsGeometry = new THREE.BoxGeometry(userPaddel1.geoX, userPaddel1.geoY, userPaddel1.geoZ);
	userPaddel = new THREE.PointLight(0xffffff, 1, 5);
	userPaddelmate = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		emissive: 0xffffff,
		emissiveIntensity: 5,
		metalness: 0.1,
		roughness: 0.1,
	  });
	userPaddel.add(new THREE.Mesh(padelsGeometry, userPaddelmate));
	userPaddel.position.set(userPaddel1.posX, userPaddel1.posY, userPaddel1.posZ);
	scene.add(userPaddel);

	//other padel
	const padelsGeometry2 = new THREE.BoxGeometry(0.3, 0.4, 2);
	opPaddel = new THREE.PointLight(0xffffff, 1, 5);
	opPaddelmate = new THREE.MeshStandardMaterial({
		color: 0xffffff,
		emissive: 0xffffff,
		emissiveIntensity: 5,
		metalness: 0.1,
		roughness: 0.1,
	  });
	opPaddel.add(new THREE.Mesh(padelsGeometry2, opPaddelmate));
	opPaddel.position.set(-9, 0.2, 0);
	scene.add(opPaddel);

	//renderer settings
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setAnimationLoop(animate);
	renderer.shadowMap.enabled = true;
	renderer.toneMapping = THREE.ReinhardToneMapping;
	container.appendChild(renderer.domElement);


	//controls
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 3;
	controls.maxDistance = 50;

	//move paddel using keyboard
	document.addEventListener('keydown', function (event) {
		if (event.key === 'ArrowLeft') {
			moveLeft = true;
		}
		else if (event.key === 'ArrowRight') {
			moveRight = true;
		}
	});
	document.addEventListener('keyup', function (event) {
		if (event.key === 'ArrowLeft') {
			moveLeft = false;
		}
		else if (event.key === 'ArrowRight') {
			moveRight = false;
		}
	});
	

	window.addEventListener('resize', onWindowResize);

	// gui control panel
	const gui = new GUI();
	gui.add(params, 'hemiIrradiance', Object.keys(hemiLuminousIrradiances));
	gui.add(params, 'bulbPower', Object.keys(bulbLuminousPowers));
	gui.add(params, 'sidesPower', Object.keys(sidesLuminousPower));
	gui.add(params, 'padelsPower', Object.keys(padelsLuminousPowers));
	gui.add(params, 'exposure', 0, 1);
	gui.add(params, 'shadows');
	gui.open();
}

//render loop
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	renderer.toneMappingExposure = Math.pow(params.exposure, 1.0); // to allow for very bright scenes.
	renderer.shadowMap.enabled = params.shadows;
	bulbLight.castShadow = params.shadows;
	sidesLight.castShadow = params.shadows;
	userPaddel.castShadow = params.shadows;
	opPaddel.castShadow = params.shadows;
	
	const deltaTime = clock.getDelta();
	const movespeed = 10;
	
	//paddle movement
	if (moveLeft) {
		userPaddel.position.z += movespeed * deltaTime;
	}
	if (moveRight) {
		userPaddel.position.z -= movespeed * deltaTime;
	}
	if (params.shadows !== previousShadowMap) {
		floorMat.needsUpdate = true;
		previousShadowMap = params.shadows;
	}
	
	//light settings
	bulbLight.power = bulbLuminousPowers[params.bulbPower];
	sidesLight.power = sidesLuminousPower[params.sidesPower];
	userPaddel.power = padelsLuminousPowers[params.padelsPower];
	opPaddel.power = padelsLuminousPowers[params.padelsPower];
	
	//light intensity
	bulbMat.emissiveIntensity = bulbLight.intensity / Math.pow(0.05, 5); // convert from intensity to irradiance at bulb surface
	sidesMate.emissiveIntensity = sidesLight.intensity / Math.pow(1, 5);
	hemiLight.intensity = hemiLuminousIrradiances[params.hemiIrradiance];
	
	//bulb light movement
	bulbLight.position.y = 0.15;
	// bulbLight.position.x = Math.PI * Math.sin(Date.now() / 250) * 2.8;
	renderer.render(scene, camera);
}
const clock = new THREE.Clock();
// animate();
