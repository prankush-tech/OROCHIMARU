import * as THREE from 'three';
import './index.css';
// import Stats from 'three/examples/jsm/libs/stats.module';
import { gsap } from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass';
import {
	planeVertexShader,
	planeFragmentShader,
	customVignetteVertexShader,
	customVignetteFragmentShader
} from './Shaders';

import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export default class Jihadinit {
	constructor(canvasID, camera, scene, stats, controls, renderer, fov = 36) {
		this.fov = fov;
		this.scene = scene;
		// this.stats = stats;
		this.camera = camera;
		this.controls = controls;
		this.renderer = renderer;
		this.canvasID = canvasID;
	}

	initScene() {
		this.clock = new THREE.Clock();
		this.scene = new THREE.Scene();
		this.camera = new THREE.PerspectiveCamera(this.fov, window.innerWidth / window.innerHeight, 1, 1000);
		this.camera.position.z = 110;
		this.camera.position.y = 20;

		const canvas = document.getElementById(this.canvasID);
		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true
		});

		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.body.appendChild(this.renderer.domElement);

		this.controls = new OrbitControls(this.camera, this.renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.05;
		this.controls.minPolarAngle = -Math.PI / 1.5; // radians
		this.controls.maxPolarAngle = Math.PI / 1.8;
		this.controls.maxAzimuthAngle = Math.PI / 2.5;
		this.controls.minAzimuthAngle = -Math.PI / 2.5;
		// this.stats = Stats();
		// document.body.appendChild(this.stats.dom);

		let sceneready = false;
		const loadingBarElement = document.querySelector('.loading-bar');
		const loadingtext = document.querySelector('.loadingtext');
		const loadingManager = new THREE.LoadingManager(
			() => {
				window.setTimeout(() => {
					// Animate overlay
					gsap.to(overlaymaterial.uniforms.uAlpha, { duration: 2, value: 0, delay: 1 });

					// Update loadingBarElement
					loadingBarElement.classList.add('ended');
					loadingBarElement.style.transform = '';
				}, 500);

				window.setTimeout(() => {
					loadingtext.style.opacity = 0;
				}, 1500);

				window.setTimeout(() => {
					sceneready = true;
				}, 2000);
			},
			(itemUrl, itemsloaded, itemsTotal) => {
				const progressRatio = itemsloaded / itemsTotal;

				loadingBarElement.style.transform = `scaleX(${progressRatio})`;
			},
			() => {
				// console.log('error')
			}
		);

		const dracoLoader = new DRACOLoader(loadingManager);
		dracoLoader.setDecoderPath('draco/');

		const gltfLoader = new GLTFLoader(loadingManager);
		gltfLoader.setDRACOLoader(dracoLoader);
		gltfLoader.load('./assets/crt_monitor/blend2.gltf', (gltf) => {
			gltf.scene.scale.set(45.25, 45.25, 45.25);
			gltf.scene.rotation.y = -Math.PI / 2;
			gltf.scene.position.y = -72;
			gltf.scene.position.z = 5;
			gltf.scene.position.x = -2;
			this.scene.add(gltf.scene);
		});

		const overlayGeometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
		const overlaymaterial = new THREE.ShaderMaterial({
			// wireframe: true,
			transparent: true,
			uniforms: {
				uAlpha: { value: 1 }
			},
			vertexShader: `
          void main(){
              gl_Position =  vec4(position,1.0);
          }
          `,

			fragmentShader: `
          uniform float uAlpha;
          void main(){
              gl_FragColor = vec4(0.,0.0,0.,uAlpha);
          }`
		});

		const overlay = new THREE.Mesh(overlayGeometry, overlaymaterial);
		// overlay.rotation.y=3
		this.scene.add(overlay);

		window.addEventListener('resize', () => this.onWindowResize(), false);

		const rtFov = 75;
		const rtNear = 0.1;
		const rtFar = 100;
		const rtWidth = 1024;
		const rtHeight = 1024;
		const rtAspect = rtWidth / rtHeight;

		this.rtScene = new THREE.Scene();
		this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight);
		this.rtCamera = new THREE.PerspectiveCamera(rtFov, rtAspect, rtNear, rtFar);
		this.rtCamera.position.z = 38;

		const color = 0xffffff;
		const intensity = 1;
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(0, 0, 200);
		this.rtScene.add(light);
		this.rtScene.background = new THREE.Color(0xfafafa);

		const planeGeometry = new THREE.PlaneGeometry(35, 27, 32, 32);
		const planeMaterial = new THREE.ShaderMaterial({
			side: THREE.DoubleSide,
			uniforms: {
				time: { type: 'f', value: 1.0 },
				uTexture: { value: this.renderTarget.texture }
			},
			vertexShader: planeVertexShader(),
			fragmentShader: planeFragmentShader()
		});

		const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
		planeMesh.position.y = 0.5;
		planeMesh.position.x = -0.6;
		planeMesh.position.z = -2.9;
		planeMesh.rotation.x = -Math.PI / 20;
		planeMesh.scale.set(1.2, 1.2, 1.2);
		this.scene.add(planeMesh);

		this.customVignetteShader = {
			uniforms: {
				tDiffuse: { value: null },
				offset: { value: 1.0 },
				darkness: { value: 3.0 },
				time: { type: 'f', value: 1.0 }
			},
			vertexShader: customVignetteVertexShader(),
			fragmentShader: customVignetteFragmentShader()
		};

		this.composer = new EffectComposer(this.renderer, this.renderTarget);
		const renderPass = new RenderPass(this.rtScene, this.rtCamera);
		const filmPass = new FilmPass(0.35, 0.025, 648, false);
		const customVignettePass = new ShaderPass(new THREE.ShaderMaterial(this.customVignetteShader));
		this.composer.addPass(renderPass);
		this.composer.addPass(customVignettePass);
		this.composer.addPass(filmPass);
	}

	animate() {
		window.requestAnimationFrame(this.animate.bind(this));
		this.render();
		// this.stats.update();
		this.controls.update();
	}

	render() {
		this.composer.render();
		this.renderer.render(this.scene, this.camera);
	}

	onWindowResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}
}
