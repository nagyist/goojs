require({
	baseUrl : "./",
	paths : {
		goo : "../src/goo",
	}
});
require(['goo/entities/World', 'goo/entities/Entity', 'goo/entities/systems/System', 'goo/entities/systems/TransformSystem',
		'goo/entities/systems/RenderSystem', 'goo/entities/components/TransformComponent', 'goo/entities/components/MeshDataComponent',
		'goo/entities/components/MeshRendererComponent', 'goo/entities/systems/PartitioningSystem', 'goo/renderer/MeshData', 'goo/renderer/Renderer',
		'goo/renderer/Material', 'goo/renderer/Shader', 'goo/entities/GooRunner', 'goo/renderer/TextureCreator', 'goo/renderer/Loader',
		'goo/loaders/JSONImporter', 'goo/entities/components/ScriptComponent', 'goo/util/DebugUI', 'goo/shapes/ShapeCreator',
		'goo/entities/EntityUtils', 'goo/renderer/Texture', 'goo/renderer/Camera', 'goo/entities/components/CameraComponent', 'goo/math/Vector3','goo/math/MathUtils',
		'goo/scripts/BasicControlScript', 'goo/entities/systems/ParticlesSystem', 'goo/entities/components/ParticleComponent', 'goo/particles/ParticleUtils', 'goo/particles/ParticleEmitter'], function(World, Entity, System, TransformSystem, RenderSystem, TransformComponent, MeshDataComponent,
	MeshRendererComponent, PartitioningSystem, MeshData, Renderer, Material, Shader, GooRunner, TextureCreator, Loader, JSONImporter,
	ScriptComponent, DebugUI, ShapeCreator, EntityUtils, Texture, Camera, CameraComponent, Vector3, MathUtils, BasicControlScript, ParticlesSystem, ParticleComponent, ParticleUtils, ParticleEmitter) {
	"use strict";

	var resourcePath = "../resources";

	var material;

	function init() {
		// Create typical goo application
		var goo = new GooRunner({
			showStats : true
		});
		goo.renderer.domElement.id = 'goo';
		document.body.appendChild(goo.renderer.domElement);

		material = Material.createMaterial(Material.shaders.particles);
		var texture = new TextureCreator().loadTexture2D(resourcePath + '/flare.png');
		texture.wrapS = 'EdgeClamp';
		texture.wrapT = 'EdgeClamp';
		texture.generateMipmaps = true;
		material.textures.push(texture);
		material.blendState.blending = 'AdditiveBlending';
		material.cullState.enabled = false;
		material.depthState.write = false;

		// Add ParticlesSystem to world.
		var particles = new ParticlesSystem();
		goo.world.setSystem(particles);
		
		// create an entity with particles
		createParticles(goo);
		
		// Add camera
		var camera = new Camera(45, 1, 1, 1000);
		camera.translation.set(0, 0, 20);
		camera.lookAt(new Vector3(0, 0, 0), Vector3.UNIT_Y);
		camera.onFrameChange();
		var cameraEntity = goo.world.createEntity("CameraEntity");
		cameraEntity.setComponent(new CameraComponent(camera));
		cameraEntity.addToWorld();
	}

	// Create simple quad
	function createParticles(goo) {
		var world = goo.world;

		// Create entity
		var entity = world.createEntity();

		entity.transformComponent.transform.translation.set(0, 0, 0);

		// Create particle component
		var particleComponent = new ParticleComponent({
			particleCount: 600,
			timeline: [
				{
					timeOffset: 0.0,
					spin: 0,
					mass: 1,
					size: 2.5,
					color: [1, 0, 0, 1]
				}, {
					timeOffset: 1.0,
					size: .5,
					color: [1, 1, 0, 0]
				}
			],
		});
		particleComponent.emitters.push(generateNewEmitter(goo));
		particleComponent.emitters.push(generateNewEmitter(goo));
		particleComponent.emitters.push(generateNewEmitter(goo));
		particleComponent.emitters.push(generateNewEmitter(goo));
		
		entity.setComponent(particleComponent);
		
		// Create meshdata component using particle data
		var meshDataComponent = new MeshDataComponent(particleComponent.meshData);
		entity.setComponent(meshDataComponent);

		// Create meshrenderer component with material and shader
		var meshRendererComponent = new MeshRendererComponent();
		meshRendererComponent.materials.push(material);
		entity.setComponent(meshRendererComponent);

		entity.setComponent(new ScriptComponent(new BasicControlScript()));

		entity.addToWorld();

		// add keyhandler for restarting particles if we run out.
		// XXX: Only useful if totalParticlesToSpawn != Infinity down in generateNewEmitter
		document.addEventListener('keydown', function(e) {
			e = window.event || e;
			var code = e.charCode || e.keyCode;
			console.log(code);
			if (code == 32) { // space bar
				// reset particles to spawn on the emitters
				for (var i = 0, max = particleComponent.emitters.length; i < max; i++) {
					if (particleComponent.emitters[i].totalParticlesToSpawn <= 0) {
						particleComponent.emitters[i].totalParticlesToSpawn = 500;
					}
				}
				particleComponent.enabled = true;
			}
		}, false);
	}
	
	function generateNewEmitter(goo) {
		var currentPos = new Vector3( Math.random() * 50 - 25,  Math.random() * 50 - 25,  Math.random() * 50 - 100), newPos = new Vector3(currentPos);

		// move our ball around
		goo.callbacks.push(function(tpf) {
    		if (Math.floor(currentPos.x) == Math.floor(newPos.x) && Math.floor(currentPos.y) == Math.floor(newPos.y)
 	               && Math.floor(currentPos.z) == Math.floor(newPos.z)) {
 	            newPos.x = Math.random() * 50 - 25;
 	            newPos.y = Math.random() * 50 - 25;
 	            newPos.z = Math.random() * 50 - 100;
 	        }
 	        currentPos.x = currentPos.x - (currentPos.x - newPos.x) * tpf;
 	        currentPos.y = currentPos.y - (currentPos.y - newPos.y) * tpf;
 	        currentPos.z = currentPos.z - (currentPos.z - newPos.z) * tpf;
		});
		
		// XXX: Try setting totalParticlesToSpawn to 500 to show limited particle emission.
		return new ParticleEmitter({
	    	totalParticlesToSpawn: Infinity,
	    	releaseRatePerSecond: 100,
	    	minLifetime: 0.1,
	    	maxLifetime: 1.5,
	    	getEmissionPoint: function(vec3) {
	    		vec3.set(currentPos);
	    	},
	    	getEmissionVelocity: function(vec3) {
	    		return ParticleUtils.getRandomVelocityOffY(vec3, 0, Math.PI, 6);
	    	}
	    });
	}

	init();
});
