define([
	'goo/loaders/handlers/ConfigHandler',
	'goo/util/rsvp',
	'goo/util/PromiseUtil',
	'goo/util/Skybox',
	'goo/shapes/Sphere',
	'goo/renderer/Renderer',
	'goo/renderer/pass/Composer',
	'goo/renderer/pass/RenderPass',
	'goo/math/Vector4',
	'goo/renderer/shaders/ShaderLib',
	'goo/renderer/pass/FullscreenPass',
	'goo/renderer/Util',
	'goo/entities/EntityUtils'
], function(
	ConfigHandler,
	RSVP,
	PromiseUtil,
	Skybox,
	Sphere,
	Renderer,
	Composer,
	RenderPass,
	Vector4,
	ShaderLib,
	FullscreenPass,
	Util,
	EntityUtils
) {
	/*jshint eqeqeq: false, -W041 */
	/**
	 * @class
	 * @constructor
	 */
	function ProjectHandler() {
		ConfigHandler.apply(this, arguments);
	}

	ProjectHandler.prototype = Object.create(ConfigHandler.prototype);
	ConfigHandler._registerClass('project', ProjectHandler);

	ProjectHandler.prototype._prepare = function(/*config*/) {};

	ProjectHandler.prototype._create = function(/*ref*/) {};

	ProjectHandler.prototype._addSkybox = function(goo, shape, textures, rotation) {
		var skybox = new Skybox(shape, textures, Sphere.TextureModes.Projected, rotation);
		var skyboxEntity = EntityUtils.createTypicalEntity(goo.world, skybox.meshData, skybox.materials[0], skybox.transform);
		skyboxEntity.transformComponent.updateWorldTransform();
		goo.world.getSystem('RenderSystem').added(skyboxEntity);
		/*
		goo.callbacksPreRender.push(function() {
			if (skybox.active) {
				goo.renderer.render([skybox], Renderer.mainCamera, []);
			}
		});
		*/
	};

	ProjectHandler.prototype._updateSkybox = function(skyboxConfig) {
		if (skyboxConfig) {
			var shape = skyboxConfig.shape.toLowerCase();
			var rotation = skyboxConfig.rotation;
			var texturePaths = skyboxConfig.texturePaths;

			this._addSkybox(this.world.gooRunner, shape, texturePaths, rotation);
		}
	};

	ProjectHandler.prototype._updateEntities = function(config) {
		var that = this;

		var promises = [];
		if (config.entityRefs && Array.isArray(config.entityRefs) && config.entityRefs.length > 0) {
			var handleEntityRef = function(entityRef) {
				return promises.push(that.getConfig(entityRef).then(function(entityConfig) {
					return that.updateObject(entityRef, entityConfig, that.options);
				}));
			};

			for (var i = 0; i < config.entityRefs.length; i++) {
				handleEntityRef(config.entityRefs[i]);
			}

			return RSVP.all(promises).then(function(entities) {
				for (var j = 0; j < entities.length; j++) {
					var entity = entities[j];
					if (that.options.beforeAdd == null || that.options.beforeAdd.apply == null || that.options.beforeAdd(entity)) {
						console.log("Adding " + entity.name + " to world");
						entity.addToWorld();
					}
				}
			}).then(null, function(err) {
				return console.error("Error updating entities: " + err);
			});
		} else {
			console.warn("No entity refs in project");
			return PromiseUtil.createDummyPromise(config);
		}
	};

	ProjectHandler.prototype._updatePosteffects = function(config) {
		var that = this;

		var promises = [];
		if (config.posteffectRefs && Array.isArray(config.posteffectRefs) && config.posteffectRefs.length > 0) {
			var handlePosteffectRef = function(posteffectRef) {
				return that.getConfig(posteffectRef).then(function(posteffectConfig) {
					return that.updateObject(posteffectRef, posteffectConfig, that.options);
				});
			};

			for (var i = 0; i < config.posteffectRefs.length; i++) {
				promises.push(handlePosteffectRef(config.posteffectRefs[i]));
			}

			return RSVP.all(promises).then(function(posteffects) {
				var mainRenderSystem = that.world.getSystem('RenderSystem');
				var composer, renderPass, outPass;
				if (mainRenderSystem.composers.length === 0) {
					composer = new Composer();
					mainRenderSystem.composers.push(composer);
					renderPass = new RenderPass(mainRenderSystem.renderList);
					//renderPass.clearColor = new Vector4(0, 0, 0, 0);
					// Regular copy
					var outPass = new FullscreenPass(Util.clone(ShaderLib.copy));
					//outPass.material.blendState.blending = 'CustomBlending';
					outPass.renderToScreen = true;
					//outPass.clear = { color: false, depth: true, stencil: true };
					outPass.clear = true;
				} else {
					composer = mainRenderSystem.composers[0];
					renderPass = composer.passes[0];
					outPass = composer.passes[composer.passes.length - 1];
				}
				composer.passes = [];
				composer.addPass(renderPass);
				for (var j = 0; j < posteffects.length; j++) {
					var posteffect = posteffects[j];
					console.log('Added posteffect', posteffect);
					composer.addPass(posteffect);
				}
				composer.addPass(outPass);
			}).then(null, function(err) {
				return console.error("Error updating posteffects: " + err);
			});
		} else {
			console.log("No posteffect refs in project");
			return PromiseUtil.createDummyPromise(config);
		}
	};

	// Returns a promise which resolves when updating is done
	ProjectHandler.prototype.update = function(ref, config) {
		// skybox
		this._updateSkybox(config.skybox);

		// entity refs
		var entitiesPromise = this._updateEntities(config);

		// posteffect refs
		var posteffectsPromise = this._updatePosteffects(config);

		return RSVP.all([entitiesPromise, posteffectsPromise]);
	};

	ProjectHandler.prototype.remove = function(/*ref*/) {};

	return ProjectHandler;

});
