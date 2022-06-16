import EventEmitter from 'events';
import * as THREE from 'three';
import browser from 'browser-detect';
import { points } from './points';
import { passiveEvent } from '../../utils/event.utils.js';

export default class InteractiveControls extends EventEmitter {

	get enabled() { return this._enabled; }

	constructor(camera, el) {
		super();

		this.camera = camera;
		this.el = el || window;

		this.plane = new THREE.Plane();
		this.raycaster = new THREE.Raycaster();

		this.mouse = new THREE.Vector2();
		this.offset = new THREE.Vector3();
		this.intersection = new THREE.Vector3();
		
		this.objects = [];
		this.hovered = null;
		this.selected = null;

		this.isDown = false;

		this.browser = browser();

		// Coordinates
		this.minX = -1
		this.minY = -1;
		this.maxX = 1;
		this.maxY = 1;
		this.xStep = 0.01;
		this.yStep = 0.0;
		this.interactX = this.minX;
		this.interactY = 0;

		this.frame = 0;
		this.num_frames = 147;
		console.log(points);

		this.enable();
	}

	enable() {
		if (this.enabled) return;
		this.addListeners();
		this._enabled = true;
	}

	disable() {
		if (!this.enabled) return;
		this.removeListeners();
		this._enabled = false;
	}

	addListeners() {
		this.handlerDown = this.onDown.bind(this);
		this.handlerMove = this.onMove.bind(this);
		this.handlerUp = this.onUp.bind(this);
		this.handlerLeave = this.onLeave.bind(this);

		if (this.browser.mobile) {
			this.el.addEventListener('touchstart', this.handlerDown, passiveEvent);
			// this.el.addEventListener('touchmove', this.handlerMove, passiveEvent);
			this.el.addEventListener('touchend', this.handlerUp, passiveEvent);
		}
		else {
			this.el.addEventListener('mousedown', this.handlerDown);
			// this.el.addEventListener('mousemove', this.handlerMove);
			this.el.addEventListener('mouseup', this.handlerUp);
			this.el.addEventListener('mouseleave', this.handlerLeave);
		}
	}

	removeListeners() {
		if (this.browser.mobile) {
			this.el.removeEventListener('touchstart', this.handlerDown);
			// this.el.removeEventListener('touchmove', this.handlerMove);
			this.el.removeEventListener('touchend', this.handlerUp);
		}
		else {
			this.el.removeEventListener('mousedown', this.handlerDown);
			// this.el.removeEventListener('mousemove', this.handlerMove);
			this.el.removeEventListener('mouseup', this.handlerUp);
			this.el.removeEventListener('mouseleave', this.handlerLeave);
		}
	}

	resize(x, y, width, height) {
		if (x || y || width || height) {
			this.rect = { x, y, width, height };
		}
		else if (this.el === window) {
			this.rect = { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight };
		}
		else {
			this.rect = this.el.getBoundingClientRect();
		}
	}

	onMove(e) {
		const t = (e.touches) ? e.touches[0] : e;
		const touch = { x: t.clientX, y: t.clientY };
		// console.log(touch);

		this.mouse.x = ((touch.x + this.rect.x) / this.rect.width) * 2 - 1;
		this.mouse.y = -((touch.y + this.rect.y) / this.rect.height) * 2 + 1;
		console.log(this.mouse);

		this.raycaster.setFromCamera(this.mouse, this.camera);

		/*
		// is dragging
		if (this.selected && this.isDown) {
			if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
				this.emit('interactive-drag', { object: this.selected, position: this.intersection.sub(this.offset) });
			}
			return;
		}
		*/

		const intersects = this.raycaster.intersectObjects(this.objects);

		if (intersects.length > 0) {
			const object = intersects[0].object;
			this.intersectionData = intersects[0];

			this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(this.plane.normal), object.position);

			if (this.hovered !== object) {
				console.log('this.hovered !== object => interactive-out & over');
				this.emit('interactive-out', { object: this.hovered });
				this.emit('interactive-over', { object });
				this.hovered = object;
			}
			else {
				// console.log(object);
				// console.log(this.intersectionData);
				this.emit('interactive-move', { object, intersectionData: this.intersectionData });
			}
		}
		else {
			this.intersectionData = null;

			if (this.hovered !== null) {
				this.emit('interactive-out', { object: this.hovered });
				this.hovered = null;
			}
		}
	}

	onInteract() {
		let interactPoints = points[this.frame.toString()];

		for (var interactPoint of interactPoints) {
			let point = {x: 0.0, y: 0.0};

			point.x = interactPoint[0] * 2 - 1;
			point.y = interactPoint[1] * 2 - 1;
			console.log(point);

			this.raycaster.setFromCamera(point, this.camera);

			const intersects = this.raycaster.intersectObjects(this.objects);

			if (intersects.length > 0) {
				const object = intersects[0].object;
				this.intersectionData = intersects[0];

				this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(this.plane.normal), object.position);

				if (this.hovered !== object) {
					// console.log('this.hovered !== object => interactive-out & over');
					this.emit('interactive-out', { object: this.hovered });
					this.emit('interactive-over', { object });
					this.hovered = object;
				}
				else {
					// console.log(object);
					// console.log(this.intersectionData);
					this.emit('interactive-move', { object, intersectionData: this.intersectionData });
				}
			}
			else {
				this.intersectionData = null;

				if (this.hovered !== null) {
					this.emit('interactive-out', { object: this.hovered });
					this.hovered = null;
				}
			}
		}

		this.frame++;
		if (this.frame > this.num_frames) {this.frame = 0}



	}

	// onInteract2() {
	// 	// const t = (e.touches) ? e.touches[0] : e;
	// 	// const touch = { x: t.clientX, y: t.clientY };
	// 	// console.log(touch);
	// 	//
	// 	// this.mouse.x = ((touch.x + this.rect.x) / this.rect.width) * 2 - 1;
	// 	// this.mouse.y = -((touch.y + this.rect.y) / this.rect.height) * 2 + 1;
	// 	if (this.interactX > 1) { return }
	//
	// 	this.mouse.x = this.interactX;
	// 	this.mouse.y = this.interactY;
	//
	// 	this.interactX += this.xStep;
	// 	this.interactY += this.yStep;
	//
	// 	console.log(this.mouse);
	//
	// 	this.raycaster.setFromCamera(this.mouse, this.camera);
	//
	// 	/*
	// 	// is dragging
	// 	if (this.selected && this.isDown) {
	// 		if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
	// 			this.emit('interactive-drag', { object: this.selected, position: this.intersection.sub(this.offset) });
	// 		}
	// 		return;
	// 	}
	// 	*/
	//
	// 	const intersects = this.raycaster.intersectObjects(this.objects);
	//
	// 	if (intersects.length > 0) {
	// 		const object = intersects[0].object;
	// 		this.intersectionData = intersects[0];
	//
	// 		this.plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(this.plane.normal), object.position);
	//
	// 		if (this.hovered !== object) {
	// 			console.log('this.hovered !== object => interactive-out & over');
	// 			this.emit('interactive-out', { object: this.hovered });
	// 			this.emit('interactive-over', { object });
	// 			this.hovered = object;
	// 		}
	// 		else {
	// 			// console.log(object);
	// 			console.log(this.intersectionData);
	// 			this.emit('interactive-move', { object, intersectionData: this.intersectionData });
	// 		}
	// 	}
	// 	else {
	// 		this.intersectionData = null;
	//
	// 		if (this.hovered !== null) {
	// 			this.emit('interactive-out', { object: this.hovered });
	// 			this.hovered = null;
	// 		}
	// 	}
	// }

	onDown(e) {
		this.isDown = true;
		this.onMove(e);

		this.emit('interactive-down', { object: this.hovered, previous: this.selected, intersectionData: this.intersectionData });
		this.selected = this.hovered;

		if (this.selected) {
			if (this.raycaster.ray.intersectPlane(this.plane, this.intersection)) {
				this.offset.copy(this.intersection).sub(this.selected.position);
			}
		}
	}

	onUp(e) {
		this.isDown = false;

		this.emit('interactive-up', { object: this.hovered });
	}

	onLeave(e) {
		this.onUp(e);
		
		this.emit('interactive-out', { object: this.hovered });
		this.hovered = null;
	}
}
