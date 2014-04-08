require([
	'goo/renderer/Material',
	'goo/entities/GooRunner',
	'goo/renderer/TextureCreator',
	'goo/entities/components/ScriptComponent',
	'goo/shapes/Box',
	'goo/entities/components/LightComponent',
	'goo/renderer/light/PointLight',
	'goo/renderer/Camera',
	'goo/entities/components/CameraComponent',
	'goo/scripts/OrbitCamControlScript',
	'goo/math/Vector3',
	'goo/renderer/shaders/ShaderLib'
], function (
	Material,
	GooRunner,
	TextureCreator,
	ScriptComponent,
	Box,
	LightComponent,
	PointLight,
	Camera,
	CameraComponent,
	OrbitCamControlScript,
	Vector3,
	ShaderLib
) {
	'use strict';

	var resourcePath = '../../../resources';

	function createBox(size, x, y, textureUrl, goo) {
		var meshData = new Box(size, size, size, 1, 1);

		var texture = new TextureCreator({
			verticalFlip : true
		}).loadTexture2D(resourcePath + textureUrl);

		var material = new Material('TestMaterial');
		material.shader = Material.createShader(ShaderLib.texturedLit, 'BoxShader');
		material.setTexture('DIFFUSE_MAP', texture);

		var box = goo.world.createEntity(meshData, material, [x, y, 0]).addToWorld();
	}

	function init() {
		// Create typical goo application
		var goo = new GooRunner({
			showStats : true
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		var camera = new Camera(45, 1, 1, 1000);
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.transformComponent.transform.translation.set(0, 5, 60);
		cameraEntity.transformComponent.transform.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		cameraEntity.setComponent(new CameraComponent(camera));
		var scripts = new ScriptComponent();
		scripts.scripts.push(new OrbitCamControlScript({
			domElement : goo.renderer.domElement,
			spherical : new Vector3(60, Math.PI / 2, 0)
		}));
		cameraEntity.setComponent(scripts);
		cameraEntity.addToWorld();

		// Setup light
		var light = new PointLight();
		var entity = goo.world.createEntity('Light1');
		entity.setComponent(new LightComponent(light));
		var transformComponent = entity.transformComponent;
		transformComponent.transform.translation.x = 80;
		transformComponent.transform.translation.y = 50;
		transformComponent.transform.translation.z = 80;
		entity.addToWorld();

		createBox(10, -10, 10, '/Pot_Diffuse.dds', goo);
		createBox(10, 10, 10, '/Pot_Diffuse.crn', goo);
		createBox(10, -10, -10, '/collectedBottles_diffuse_1024.dds', goo);
		createBox(10, 10, -10, '/collectedBottles_diffuse_1024.crn', goo);
	}

	init();
});
