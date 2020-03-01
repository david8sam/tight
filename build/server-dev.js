/******/ (function(modules) { // webpackBootstrap
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadUpdateChunk(chunkId) {
/******/ 		var chunk = require("./" + "hot/" + chunkId + "." + hotCurrentHash + ".hot-update.js");
/******/ 		hotAddUpdateChunk(chunk.id, chunk.modules);
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotDownloadManifest() {
/******/ 		try {
/******/ 			var update = require("./" + "hot/" + hotCurrentHash + ".hot-update.json");
/******/ 		} catch (e) {
/******/ 			return Promise.resolve();
/******/ 		}
/******/ 		return Promise.resolve(update);
/******/ 	}
/******/
/******/ 	//eslint-disable-next-line no-unused-vars
/******/ 	function hotDisposeChunk(chunkId) {
/******/ 		delete installedChunks[chunkId];
/******/ 	}
/******/
/******/ 	var hotApplyOnUpdate = true;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentHash = "14023b153f07b2d10099";
/******/ 	var hotRequestTimeout = 10000;
/******/ 	var hotCurrentModuleData = {};
/******/ 	var hotCurrentChildModule;
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParents = [];
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	var hotCurrentParentsTemp = [];
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateRequire(moduleId) {
/******/ 		var me = installedModules[moduleId];
/******/ 		if (!me) return __webpack_require__;
/******/ 		var fn = function(request) {
/******/ 			if (me.hot.active) {
/******/ 				if (installedModules[request]) {
/******/ 					if (installedModules[request].parents.indexOf(moduleId) === -1) {
/******/ 						installedModules[request].parents.push(moduleId);
/******/ 					}
/******/ 				} else {
/******/ 					hotCurrentParents = [moduleId];
/******/ 					hotCurrentChildModule = request;
/******/ 				}
/******/ 				if (me.children.indexOf(request) === -1) {
/******/ 					me.children.push(request);
/******/ 				}
/******/ 			} else {
/******/ 				console.warn(
/******/ 					"[HMR] unexpected require(" +
/******/ 						request +
/******/ 						") from disposed module " +
/******/ 						moduleId
/******/ 				);
/******/ 				hotCurrentParents = [];
/******/ 			}
/******/ 			return __webpack_require__(request);
/******/ 		};
/******/ 		var ObjectFactory = function ObjectFactory(name) {
/******/ 			return {
/******/ 				configurable: true,
/******/ 				enumerable: true,
/******/ 				get: function() {
/******/ 					return __webpack_require__[name];
/******/ 				},
/******/ 				set: function(value) {
/******/ 					__webpack_require__[name] = value;
/******/ 				}
/******/ 			};
/******/ 		};
/******/ 		for (var name in __webpack_require__) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(__webpack_require__, name) &&
/******/ 				name !== "e" &&
/******/ 				name !== "t"
/******/ 			) {
/******/ 				Object.defineProperty(fn, name, ObjectFactory(name));
/******/ 			}
/******/ 		}
/******/ 		fn.e = function(chunkId) {
/******/ 			if (hotStatus === "ready") hotSetStatus("prepare");
/******/ 			hotChunksLoading++;
/******/ 			return __webpack_require__.e(chunkId).then(finishChunkLoading, function(err) {
/******/ 				finishChunkLoading();
/******/ 				throw err;
/******/ 			});
/******/
/******/ 			function finishChunkLoading() {
/******/ 				hotChunksLoading--;
/******/ 				if (hotStatus === "prepare") {
/******/ 					if (!hotWaitingFilesMap[chunkId]) {
/******/ 						hotEnsureUpdateChunk(chunkId);
/******/ 					}
/******/ 					if (hotChunksLoading === 0 && hotWaitingFiles === 0) {
/******/ 						hotUpdateDownloaded();
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		fn.t = function(value, mode) {
/******/ 			if (mode & 1) value = fn(value);
/******/ 			return __webpack_require__.t(value, mode & ~1);
/******/ 		};
/******/ 		return fn;
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotCreateModule(moduleId) {
/******/ 		var hot = {
/******/ 			// private stuff
/******/ 			_acceptedDependencies: {},
/******/ 			_declinedDependencies: {},
/******/ 			_selfAccepted: false,
/******/ 			_selfDeclined: false,
/******/ 			_disposeHandlers: [],
/******/ 			_main: hotCurrentChildModule !== moduleId,
/******/
/******/ 			// Module API
/******/ 			active: true,
/******/ 			accept: function(dep, callback) {
/******/ 				if (dep === undefined) hot._selfAccepted = true;
/******/ 				else if (typeof dep === "function") hot._selfAccepted = dep;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._acceptedDependencies[dep[i]] = callback || function() {};
/******/ 				else hot._acceptedDependencies[dep] = callback || function() {};
/******/ 			},
/******/ 			decline: function(dep) {
/******/ 				if (dep === undefined) hot._selfDeclined = true;
/******/ 				else if (typeof dep === "object")
/******/ 					for (var i = 0; i < dep.length; i++)
/******/ 						hot._declinedDependencies[dep[i]] = true;
/******/ 				else hot._declinedDependencies[dep] = true;
/******/ 			},
/******/ 			dispose: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			addDisposeHandler: function(callback) {
/******/ 				hot._disposeHandlers.push(callback);
/******/ 			},
/******/ 			removeDisposeHandler: function(callback) {
/******/ 				var idx = hot._disposeHandlers.indexOf(callback);
/******/ 				if (idx >= 0) hot._disposeHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			// Management API
/******/ 			check: hotCheck,
/******/ 			apply: hotApply,
/******/ 			status: function(l) {
/******/ 				if (!l) return hotStatus;
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			addStatusHandler: function(l) {
/******/ 				hotStatusHandlers.push(l);
/******/ 			},
/******/ 			removeStatusHandler: function(l) {
/******/ 				var idx = hotStatusHandlers.indexOf(l);
/******/ 				if (idx >= 0) hotStatusHandlers.splice(idx, 1);
/******/ 			},
/******/
/******/ 			//inherit from previous dispose call
/******/ 			data: hotCurrentModuleData[moduleId]
/******/ 		};
/******/ 		hotCurrentChildModule = undefined;
/******/ 		return hot;
/******/ 	}
/******/
/******/ 	var hotStatusHandlers = [];
/******/ 	var hotStatus = "idle";
/******/
/******/ 	function hotSetStatus(newStatus) {
/******/ 		hotStatus = newStatus;
/******/ 		for (var i = 0; i < hotStatusHandlers.length; i++)
/******/ 			hotStatusHandlers[i].call(null, newStatus);
/******/ 	}
/******/
/******/ 	// while downloading
/******/ 	var hotWaitingFiles = 0;
/******/ 	var hotChunksLoading = 0;
/******/ 	var hotWaitingFilesMap = {};
/******/ 	var hotRequestedFilesMap = {};
/******/ 	var hotAvailableFilesMap = {};
/******/ 	var hotDeferred;
/******/
/******/ 	// The update info
/******/ 	var hotUpdate, hotUpdateNewHash;
/******/
/******/ 	function toModuleId(id) {
/******/ 		var isNumber = +id + "" === id;
/******/ 		return isNumber ? +id : id;
/******/ 	}
/******/
/******/ 	function hotCheck(apply) {
/******/ 		if (hotStatus !== "idle") {
/******/ 			throw new Error("check() is only allowed in idle status");
/******/ 		}
/******/ 		hotApplyOnUpdate = apply;
/******/ 		hotSetStatus("check");
/******/ 		return hotDownloadManifest(hotRequestTimeout).then(function(update) {
/******/ 			if (!update) {
/******/ 				hotSetStatus("idle");
/******/ 				return null;
/******/ 			}
/******/ 			hotRequestedFilesMap = {};
/******/ 			hotWaitingFilesMap = {};
/******/ 			hotAvailableFilesMap = update.c;
/******/ 			hotUpdateNewHash = update.h;
/******/
/******/ 			hotSetStatus("prepare");
/******/ 			var promise = new Promise(function(resolve, reject) {
/******/ 				hotDeferred = {
/******/ 					resolve: resolve,
/******/ 					reject: reject
/******/ 				};
/******/ 			});
/******/ 			hotUpdate = {};
/******/ 			var chunkId = "main";
/******/ 			// eslint-disable-next-line no-lone-blocks
/******/ 			{
/******/ 				hotEnsureUpdateChunk(chunkId);
/******/ 			}
/******/ 			if (
/******/ 				hotStatus === "prepare" &&
/******/ 				hotChunksLoading === 0 &&
/******/ 				hotWaitingFiles === 0
/******/ 			) {
/******/ 				hotUpdateDownloaded();
/******/ 			}
/******/ 			return promise;
/******/ 		});
/******/ 	}
/******/
/******/ 	// eslint-disable-next-line no-unused-vars
/******/ 	function hotAddUpdateChunk(chunkId, moreModules) {
/******/ 		if (!hotAvailableFilesMap[chunkId] || !hotRequestedFilesMap[chunkId])
/******/ 			return;
/******/ 		hotRequestedFilesMap[chunkId] = false;
/******/ 		for (var moduleId in moreModules) {
/******/ 			if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				hotUpdate[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if (--hotWaitingFiles === 0 && hotChunksLoading === 0) {
/******/ 			hotUpdateDownloaded();
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotEnsureUpdateChunk(chunkId) {
/******/ 		if (!hotAvailableFilesMap[chunkId]) {
/******/ 			hotWaitingFilesMap[chunkId] = true;
/******/ 		} else {
/******/ 			hotRequestedFilesMap[chunkId] = true;
/******/ 			hotWaitingFiles++;
/******/ 			hotDownloadUpdateChunk(chunkId);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotUpdateDownloaded() {
/******/ 		hotSetStatus("ready");
/******/ 		var deferred = hotDeferred;
/******/ 		hotDeferred = null;
/******/ 		if (!deferred) return;
/******/ 		if (hotApplyOnUpdate) {
/******/ 			// Wrap deferred object in Promise to mark it as a well-handled Promise to
/******/ 			// avoid triggering uncaught exception warning in Chrome.
/******/ 			// See https://bugs.chromium.org/p/chromium/issues/detail?id=465666
/******/ 			Promise.resolve()
/******/ 				.then(function() {
/******/ 					return hotApply(hotApplyOnUpdate);
/******/ 				})
/******/ 				.then(
/******/ 					function(result) {
/******/ 						deferred.resolve(result);
/******/ 					},
/******/ 					function(err) {
/******/ 						deferred.reject(err);
/******/ 					}
/******/ 				);
/******/ 		} else {
/******/ 			var outdatedModules = [];
/******/ 			for (var id in hotUpdate) {
/******/ 				if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 					outdatedModules.push(toModuleId(id));
/******/ 				}
/******/ 			}
/******/ 			deferred.resolve(outdatedModules);
/******/ 		}
/******/ 	}
/******/
/******/ 	function hotApply(options) {
/******/ 		if (hotStatus !== "ready")
/******/ 			throw new Error("apply() is only allowed in ready status");
/******/ 		options = options || {};
/******/
/******/ 		var cb;
/******/ 		var i;
/******/ 		var j;
/******/ 		var module;
/******/ 		var moduleId;
/******/
/******/ 		function getAffectedStuff(updateModuleId) {
/******/ 			var outdatedModules = [updateModuleId];
/******/ 			var outdatedDependencies = {};
/******/
/******/ 			var queue = outdatedModules.map(function(id) {
/******/ 				return {
/******/ 					chain: [id],
/******/ 					id: id
/******/ 				};
/******/ 			});
/******/ 			while (queue.length > 0) {
/******/ 				var queueItem = queue.pop();
/******/ 				var moduleId = queueItem.id;
/******/ 				var chain = queueItem.chain;
/******/ 				module = installedModules[moduleId];
/******/ 				if (!module || module.hot._selfAccepted) continue;
/******/ 				if (module.hot._selfDeclined) {
/******/ 					return {
/******/ 						type: "self-declined",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				if (module.hot._main) {
/******/ 					return {
/******/ 						type: "unaccepted",
/******/ 						chain: chain,
/******/ 						moduleId: moduleId
/******/ 					};
/******/ 				}
/******/ 				for (var i = 0; i < module.parents.length; i++) {
/******/ 					var parentId = module.parents[i];
/******/ 					var parent = installedModules[parentId];
/******/ 					if (!parent) continue;
/******/ 					if (parent.hot._declinedDependencies[moduleId]) {
/******/ 						return {
/******/ 							type: "declined",
/******/ 							chain: chain.concat([parentId]),
/******/ 							moduleId: moduleId,
/******/ 							parentId: parentId
/******/ 						};
/******/ 					}
/******/ 					if (outdatedModules.indexOf(parentId) !== -1) continue;
/******/ 					if (parent.hot._acceptedDependencies[moduleId]) {
/******/ 						if (!outdatedDependencies[parentId])
/******/ 							outdatedDependencies[parentId] = [];
/******/ 						addAllToSet(outdatedDependencies[parentId], [moduleId]);
/******/ 						continue;
/******/ 					}
/******/ 					delete outdatedDependencies[parentId];
/******/ 					outdatedModules.push(parentId);
/******/ 					queue.push({
/******/ 						chain: chain.concat([parentId]),
/******/ 						id: parentId
/******/ 					});
/******/ 				}
/******/ 			}
/******/
/******/ 			return {
/******/ 				type: "accepted",
/******/ 				moduleId: updateModuleId,
/******/ 				outdatedModules: outdatedModules,
/******/ 				outdatedDependencies: outdatedDependencies
/******/ 			};
/******/ 		}
/******/
/******/ 		function addAllToSet(a, b) {
/******/ 			for (var i = 0; i < b.length; i++) {
/******/ 				var item = b[i];
/******/ 				if (a.indexOf(item) === -1) a.push(item);
/******/ 			}
/******/ 		}
/******/
/******/ 		// at begin all updates modules are outdated
/******/ 		// the "outdated" status can propagate to parents if they don't accept the children
/******/ 		var outdatedDependencies = {};
/******/ 		var outdatedModules = [];
/******/ 		var appliedUpdate = {};
/******/
/******/ 		var warnUnexpectedRequire = function warnUnexpectedRequire() {
/******/ 			console.warn(
/******/ 				"[HMR] unexpected require(" + result.moduleId + ") to disposed module"
/******/ 			);
/******/ 		};
/******/
/******/ 		for (var id in hotUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(hotUpdate, id)) {
/******/ 				moduleId = toModuleId(id);
/******/ 				/** @type {TODO} */
/******/ 				var result;
/******/ 				if (hotUpdate[id]) {
/******/ 					result = getAffectedStuff(moduleId);
/******/ 				} else {
/******/ 					result = {
/******/ 						type: "disposed",
/******/ 						moduleId: id
/******/ 					};
/******/ 				}
/******/ 				/** @type {Error|false} */
/******/ 				var abortError = false;
/******/ 				var doApply = false;
/******/ 				var doDispose = false;
/******/ 				var chainInfo = "";
/******/ 				if (result.chain) {
/******/ 					chainInfo = "\nUpdate propagation: " + result.chain.join(" -> ");
/******/ 				}
/******/ 				switch (result.type) {
/******/ 					case "self-declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of self decline: " +
/******/ 									result.moduleId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "declined":
/******/ 						if (options.onDeclined) options.onDeclined(result);
/******/ 						if (!options.ignoreDeclined)
/******/ 							abortError = new Error(
/******/ 								"Aborted because of declined dependency: " +
/******/ 									result.moduleId +
/******/ 									" in " +
/******/ 									result.parentId +
/******/ 									chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "unaccepted":
/******/ 						if (options.onUnaccepted) options.onUnaccepted(result);
/******/ 						if (!options.ignoreUnaccepted)
/******/ 							abortError = new Error(
/******/ 								"Aborted because " + moduleId + " is not accepted" + chainInfo
/******/ 							);
/******/ 						break;
/******/ 					case "accepted":
/******/ 						if (options.onAccepted) options.onAccepted(result);
/******/ 						doApply = true;
/******/ 						break;
/******/ 					case "disposed":
/******/ 						if (options.onDisposed) options.onDisposed(result);
/******/ 						doDispose = true;
/******/ 						break;
/******/ 					default:
/******/ 						throw new Error("Unexception type " + result.type);
/******/ 				}
/******/ 				if (abortError) {
/******/ 					hotSetStatus("abort");
/******/ 					return Promise.reject(abortError);
/******/ 				}
/******/ 				if (doApply) {
/******/ 					appliedUpdate[moduleId] = hotUpdate[moduleId];
/******/ 					addAllToSet(outdatedModules, result.outdatedModules);
/******/ 					for (moduleId in result.outdatedDependencies) {
/******/ 						if (
/******/ 							Object.prototype.hasOwnProperty.call(
/******/ 								result.outdatedDependencies,
/******/ 								moduleId
/******/ 							)
/******/ 						) {
/******/ 							if (!outdatedDependencies[moduleId])
/******/ 								outdatedDependencies[moduleId] = [];
/******/ 							addAllToSet(
/******/ 								outdatedDependencies[moduleId],
/******/ 								result.outdatedDependencies[moduleId]
/******/ 							);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 				if (doDispose) {
/******/ 					addAllToSet(outdatedModules, [result.moduleId]);
/******/ 					appliedUpdate[moduleId] = warnUnexpectedRequire;
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Store self accepted outdated modules to require them later by the module system
/******/ 		var outdatedSelfAcceptedModules = [];
/******/ 		for (i = 0; i < outdatedModules.length; i++) {
/******/ 			moduleId = outdatedModules[i];
/******/ 			if (
/******/ 				installedModules[moduleId] &&
/******/ 				installedModules[moduleId].hot._selfAccepted &&
/******/ 				// removed self-accepted modules should not be required
/******/ 				appliedUpdate[moduleId] !== warnUnexpectedRequire
/******/ 			) {
/******/ 				outdatedSelfAcceptedModules.push({
/******/ 					module: moduleId,
/******/ 					errorHandler: installedModules[moduleId].hot._selfAccepted
/******/ 				});
/******/ 			}
/******/ 		}
/******/
/******/ 		// Now in "dispose" phase
/******/ 		hotSetStatus("dispose");
/******/ 		Object.keys(hotAvailableFilesMap).forEach(function(chunkId) {
/******/ 			if (hotAvailableFilesMap[chunkId] === false) {
/******/ 				hotDisposeChunk(chunkId);
/******/ 			}
/******/ 		});
/******/
/******/ 		var idx;
/******/ 		var queue = outdatedModules.slice();
/******/ 		while (queue.length > 0) {
/******/ 			moduleId = queue.pop();
/******/ 			module = installedModules[moduleId];
/******/ 			if (!module) continue;
/******/
/******/ 			var data = {};
/******/
/******/ 			// Call dispose handlers
/******/ 			var disposeHandlers = module.hot._disposeHandlers;
/******/ 			for (j = 0; j < disposeHandlers.length; j++) {
/******/ 				cb = disposeHandlers[j];
/******/ 				cb(data);
/******/ 			}
/******/ 			hotCurrentModuleData[moduleId] = data;
/******/
/******/ 			// disable module (this disables requires from this module)
/******/ 			module.hot.active = false;
/******/
/******/ 			// remove module from cache
/******/ 			delete installedModules[moduleId];
/******/
/******/ 			// when disposing there is no need to call dispose handler
/******/ 			delete outdatedDependencies[moduleId];
/******/
/******/ 			// remove "parents" references from all children
/******/ 			for (j = 0; j < module.children.length; j++) {
/******/ 				var child = installedModules[module.children[j]];
/******/ 				if (!child) continue;
/******/ 				idx = child.parents.indexOf(moduleId);
/******/ 				if (idx >= 0) {
/******/ 					child.parents.splice(idx, 1);
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// remove outdated dependency from module children
/******/ 		var dependency;
/******/ 		var moduleOutdatedDependencies;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					for (j = 0; j < moduleOutdatedDependencies.length; j++) {
/******/ 						dependency = moduleOutdatedDependencies[j];
/******/ 						idx = module.children.indexOf(dependency);
/******/ 						if (idx >= 0) module.children.splice(idx, 1);
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Now in "apply" phase
/******/ 		hotSetStatus("apply");
/******/
/******/ 		hotCurrentHash = hotUpdateNewHash;
/******/
/******/ 		// insert new code
/******/ 		for (moduleId in appliedUpdate) {
/******/ 			if (Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
/******/ 				modules[moduleId] = appliedUpdate[moduleId];
/******/ 			}
/******/ 		}
/******/
/******/ 		// call accept handlers
/******/ 		var error = null;
/******/ 		for (moduleId in outdatedDependencies) {
/******/ 			if (
/******/ 				Object.prototype.hasOwnProperty.call(outdatedDependencies, moduleId)
/******/ 			) {
/******/ 				module = installedModules[moduleId];
/******/ 				if (module) {
/******/ 					moduleOutdatedDependencies = outdatedDependencies[moduleId];
/******/ 					var callbacks = [];
/******/ 					for (i = 0; i < moduleOutdatedDependencies.length; i++) {
/******/ 						dependency = moduleOutdatedDependencies[i];
/******/ 						cb = module.hot._acceptedDependencies[dependency];
/******/ 						if (cb) {
/******/ 							if (callbacks.indexOf(cb) !== -1) continue;
/******/ 							callbacks.push(cb);
/******/ 						}
/******/ 					}
/******/ 					for (i = 0; i < callbacks.length; i++) {
/******/ 						cb = callbacks[i];
/******/ 						try {
/******/ 							cb(moduleOutdatedDependencies);
/******/ 						} catch (err) {
/******/ 							if (options.onErrored) {
/******/ 								options.onErrored({
/******/ 									type: "accept-errored",
/******/ 									moduleId: moduleId,
/******/ 									dependencyId: moduleOutdatedDependencies[i],
/******/ 									error: err
/******/ 								});
/******/ 							}
/******/ 							if (!options.ignoreErrored) {
/******/ 								if (!error) error = err;
/******/ 							}
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// Load self accepted modules
/******/ 		for (i = 0; i < outdatedSelfAcceptedModules.length; i++) {
/******/ 			var item = outdatedSelfAcceptedModules[i];
/******/ 			moduleId = item.module;
/******/ 			hotCurrentParents = [moduleId];
/******/ 			try {
/******/ 				__webpack_require__(moduleId);
/******/ 			} catch (err) {
/******/ 				if (typeof item.errorHandler === "function") {
/******/ 					try {
/******/ 						item.errorHandler(err);
/******/ 					} catch (err2) {
/******/ 						if (options.onErrored) {
/******/ 							options.onErrored({
/******/ 								type: "self-accept-error-handler-errored",
/******/ 								moduleId: moduleId,
/******/ 								error: err2,
/******/ 								originalError: err
/******/ 							});
/******/ 						}
/******/ 						if (!options.ignoreErrored) {
/******/ 							if (!error) error = err2;
/******/ 						}
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				} else {
/******/ 					if (options.onErrored) {
/******/ 						options.onErrored({
/******/ 							type: "self-accept-errored",
/******/ 							moduleId: moduleId,
/******/ 							error: err
/******/ 						});
/******/ 					}
/******/ 					if (!options.ignoreErrored) {
/******/ 						if (!error) error = err;
/******/ 					}
/******/ 				}
/******/ 			}
/******/ 		}
/******/
/******/ 		// handle errors in accept handlers and self accepted module load
/******/ 		if (error) {
/******/ 			hotSetStatus("fail");
/******/ 			return Promise.reject(error);
/******/ 		}
/******/
/******/ 		hotSetStatus("idle");
/******/ 		return new Promise(function(resolve) {
/******/ 			resolve(outdatedModules);
/******/ 		});
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {},
/******/ 			hot: hotCreateModule(moduleId),
/******/ 			parents: (hotCurrentParentsTemp = hotCurrentParents, hotCurrentParents = [], hotCurrentParentsTemp),
/******/ 			children: []
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, hotCreateRequire(moduleId));
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/";
/******/
/******/ 	// __webpack_hash__
/******/ 	__webpack_require__.h = function() { return hotCurrentHash; };
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return hotCreateRequire("./src/server/index.ts")(__webpack_require__.s = "./src/server/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/common/Game.ts":
/*!****************************!*\
  !*** ./src/common/Game.ts ***!
  \****************************/
/*! exports provided: PlayerColor, Version, Phase, StrategyCardIndex */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"PlayerColor\", function() { return PlayerColor; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Version\", function() { return Version; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Phase\", function() { return Phase; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"StrategyCardIndex\", function() { return StrategyCardIndex; });\n/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @material-ui/core */ \"@material-ui/core\");\n/* harmony import */ var _material_ui_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_material_ui_core__WEBPACK_IMPORTED_MODULE_0__);\n\r\nconst PlayerColor = {\r\n    RED: _material_ui_core__WEBPACK_IMPORTED_MODULE_0__[\"colors\"].red.A700,\r\n    YELLOW: _material_ui_core__WEBPACK_IMPORTED_MODULE_0__[\"colors\"].yellow[500],\r\n    GREEN: _material_ui_core__WEBPACK_IMPORTED_MODULE_0__[\"colors\"].green[500],\r\n    BLUE: _material_ui_core__WEBPACK_IMPORTED_MODULE_0__[\"colors\"].blue.A700,\r\n    PURPLE: _material_ui_core__WEBPACK_IMPORTED_MODULE_0__[\"colors\"].deepPurple[500],\r\n    BLACK: '#000',\r\n};\r\nvar Version;\r\n(function (Version) {\r\n    Version[\"TI3\"] = \"3\";\r\n    Version[\"TI4\"] = \"4\";\r\n})(Version || (Version = {}));\r\nvar Phase;\r\n(function (Phase) {\r\n    Phase[Phase[\"STRATEGY\"] = 0] = \"STRATEGY\";\r\n    Phase[Phase[\"ACTION\"] = 1] = \"ACTION\";\r\n    Phase[Phase[\"STATUS\"] = 2] = \"STATUS\";\r\n    Phase[Phase[\"AGENDA\"] = 3] = \"AGENDA\";\r\n})(Phase || (Phase = {}));\r\nvar StrategyCardIndex;\r\n(function (StrategyCardIndex) {\r\n    StrategyCardIndex[StrategyCardIndex[\"NONE\"] = 0] = \"NONE\";\r\n    StrategyCardIndex[StrategyCardIndex[\"LEADERSHIP\"] = 1] = \"LEADERSHIP\";\r\n    StrategyCardIndex[StrategyCardIndex[\"DIPLOMACY\"] = 2] = \"DIPLOMACY\";\r\n    StrategyCardIndex[StrategyCardIndex[\"POLITICS\"] = 3] = \"POLITICS\";\r\n    StrategyCardIndex[StrategyCardIndex[\"CONSTRUCTION\"] = 4] = \"CONSTRUCTION\";\r\n    StrategyCardIndex[StrategyCardIndex[\"TRADE\"] = 5] = \"TRADE\";\r\n    StrategyCardIndex[StrategyCardIndex[\"WARFARE\"] = 6] = \"WARFARE\";\r\n    StrategyCardIndex[StrategyCardIndex[\"TECHNOLOGY\"] = 7] = \"TECHNOLOGY\";\r\n    StrategyCardIndex[StrategyCardIndex[\"IMPERIAL\"] = 8] = \"IMPERIAL\";\r\n})(StrategyCardIndex || (StrategyCardIndex = {}));\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tbW9uL0dhbWUudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL2NvbW1vbi9HYW1lLnRzPzYwZjQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY29sb3JzIH0gZnJvbSAnQG1hdGVyaWFsLXVpL2NvcmUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IFBsYXllckNvbG9yID0ge1xyXG4gICAgUkVEOiBjb2xvcnMucmVkLkE3MDAsXHJcbiAgICBZRUxMT1c6IGNvbG9ycy55ZWxsb3dbNTAwXSxcclxuICAgIEdSRUVOOiBjb2xvcnMuZ3JlZW5bNTAwXSxcclxuICAgIEJMVUU6IGNvbG9ycy5ibHVlLkE3MDAsXHJcbiAgICBQVVJQTEU6IGNvbG9ycy5kZWVwUHVycGxlWzUwMF0sXHJcbiAgICBCTEFDSzogJyMwMDAnLFxyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgUGxheWVyQ29sb3JLZXkgPSBrZXlvZiB0eXBlb2YgUGxheWVyQ29sb3I7XHJcbmV4cG9ydCB0eXBlIFBsYXllckNvbG9yVmFsdWUgPSB0eXBlb2YgUGxheWVyQ29sb3JbUGxheWVyQ29sb3JLZXldO1xyXG5cclxuZXhwb3J0IGVudW0gVmVyc2lvbiB7XHJcbiAgICBUSTMgPSAnMycsXHJcbiAgICBUSTQgPSAnNCcsXHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIFBoYXNlIHtcclxuICAgIFNUUkFURUdZLFxyXG4gICAgQUNUSU9OLFxyXG4gICAgU1RBVFVTLFxyXG4gICAgQUdFTkRBLFxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFN0cmF0ZWd5Q2FyZCB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBpbml0aWF0aXZlOiBudW1iZXI7XHJcbiAgICBwcmltYXJ5OiBzdHJpbmdbXTtcclxuICAgIHNlY29uZGFyeTogc3RyaW5nW107XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFN0cmF0ZWd5Q2FyZHNUeXBlID0gcmVhZG9ubHkgW1xyXG4gICAgdW5kZWZpbmVkLFxyXG4gICAgUmVhZG9ubHk8U3RyYXRlZ3lDYXJkPixcclxuICAgIFJlYWRvbmx5PFN0cmF0ZWd5Q2FyZD4sXHJcbiAgICBSZWFkb25seTxTdHJhdGVneUNhcmQ+LFxyXG4gICAgUmVhZG9ubHk8U3RyYXRlZ3lDYXJkPixcclxuICAgIFJlYWRvbmx5PFN0cmF0ZWd5Q2FyZD4sXHJcbiAgICBSZWFkb25seTxTdHJhdGVneUNhcmQ+LFxyXG4gICAgUmVhZG9ubHk8U3RyYXRlZ3lDYXJkPixcclxuICAgIFJlYWRvbmx5PFN0cmF0ZWd5Q2FyZD4sXHJcbl07XHJcblxyXG5leHBvcnQgZW51bSBTdHJhdGVneUNhcmRJbmRleCB7XHJcbiAgICBOT05FID0gMCxcclxuICAgIExFQURFUlNISVAsXHJcbiAgICBESVBMT01BQ1ksXHJcbiAgICBQT0xJVElDUyxcclxuICAgIENPTlNUUlVDVElPTixcclxuICAgIFRSQURFLFxyXG4gICAgV0FSRkFSRSxcclxuICAgIFRFQ0hOT0xPR1ksXHJcbiAgICBJTVBFUklBTCxcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHYW1lU3RhdHVzIHtcclxuICAgIHN0YXJ0ZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcm91bmQ6IG51bWJlcjtcclxuICAgIHBoYXNlOiBQaGFzZTtcclxuICAgIHR1cm4/OiBTdHJhdGVneUNhcmRJbmRleDtcclxuXHJcbiAgICBzcGVha2VyOiBzdHJpbmc7XHJcbiAgICBwaWNrT3JkZXI6IHN0cmluZ1tdOyAvLyBzdGFydGluZyB3aXRoIHNwZWFrZXIsIHRoZSBvcmRlciBvZiBwbGF5ZXJzIGZvciBwaWNraW5nIHN0cmF0ZWd5IGNhcmRzXHJcbiAgICBwaWNrVHVybjogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdhbWVQbGFuZXQge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgb3duZXI6IHN0cmluZyB8IG51bGw7XHJcbiAgICByZWZyZXNoZWQ6IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgR2FtZVBsYW5ldE1hcCB7XHJcbiAgICBbbmFtZTogc3RyaW5nXTogR2FtZVBsYW5ldDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHYW1lUGxheWVyIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBqb2luZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgY29sb3I/OiBQbGF5ZXJDb2xvclZhbHVlIHwgbnVsbDtcclxuICAgIGZhY3Rpb24/OiBzdHJpbmcgfCBudWxsO1xyXG5cclxuICAgIHN0cmF0ZWd5Q2FyZDogU3RyYXRlZ3lDYXJkSW5kZXg7XHJcbiAgICBzdHJhdGVneUNhcmRUYWtlbjogYm9vbGVhbjtcclxuICAgIHN0cmFnZXR5Q2FyZFVzZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgcGFzc2VkOiBib29sZWFuO1xyXG5cclxuICAgIHBsYW5ldHM6IHN0cmluZ1tdO1xyXG4gICAgdmljdG9yeVBvaW50czogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdhbWVQbGF5ZXJNYXAge1xyXG4gICAgW2lkOiBzdHJpbmddOiBHYW1lUGxheWVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdhbWUge1xyXG4gICAgcmVhZG9ubHkgaWQ6IHN0cmluZztcclxuICAgIHJlYWRvbmx5IGRhdGU6IG51bWJlcjtcclxuICAgIHJlYWRvbmx5IHZlcnNpb246IFZlcnNpb247XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBjcmVhdG9yOiBzdHJpbmc7XHJcbiAgICBwbGF5ZXJzOiBHYW1lUGxheWVyTWFwO1xyXG4gICAgcGxhbmV0czogR2FtZVBsYW5ldE1hcDtcclxuICAgIHN0YXR1czogR2FtZVN0YXR1cztcclxuICAgIGxhc3RTYXZlZD86IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHYW1lTWFwIHtcclxuICAgIFtpZDogc3RyaW5nXTogR2FtZTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBHYW1lQ2hhbmdlRGF0YSB7XHJcbiAgICBpZDogc3RyaW5nO1xyXG4gICAgY3JlYXRlZD86IEdhbWU7XHJcbiAgICBkZWxldGVkPzogYm9vbGVhbjtcclxuICAgIHN0YXR1cz86IEdhbWVTdGF0dXM7XHJcbiAgICBwbGFuZXRzPzogR2FtZVBsYW5ldE1hcDtcclxuICAgIHBsYXllcnM/OiBHYW1lUGxheWVyTWFwO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEdhbWVDaGFuZ2VEYXRhTWFwIHtcclxuICAgIFtpZDogc3RyaW5nXTogR2FtZUNoYW5nZURhdGE7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUtBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQXFCQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/common/Game.ts\n");

/***/ }),

/***/ "./src/common/Planet.ts":
/*!******************************!*\
  !*** ./src/common/Planet.ts ***!
  \******************************/
/*! exports provided: Traits, getPlanetsById */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Traits\", function() { return Traits; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getPlanetsById\", function() { return getPlanetsById; });\nvar Traits;\r\n(function (Traits) {\r\n    Traits[\"CULTURAL\"] = \"CULTURAL\";\r\n    Traits[\"HAZARDOUS\"] = \"HAZARDOUS\";\r\n    Traits[\"INDUSTRIAL\"] = \"INDUSTRIAL\";\r\n})(Traits || (Traits = {}));\r\nfunction getPlanetsById(planets, id) {\r\n    const idArray = Array.isArray(id) ? id : [id];\r\n    const planetArray = [];\r\n    idArray.forEach(i => {\r\n        const planet = planets[i];\r\n        if (planet) {\r\n            planetArray.push(planet);\r\n        }\r\n    });\r\n    return planetArray;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tbW9uL1BsYW5ldC50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvY29tbW9uL1BsYW5ldC50cz9lZGVkIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBlbnVtIFRyYWl0cyB7XHJcbiAgICBDVUxUVVJBTCA9ICdDVUxUVVJBTCcsXHJcbiAgICBIQVpBUkRPVVMgPSAnSEFaQVJET1VTJyxcclxuICAgIElORFVTVFJJQUwgPSAnSU5EVVNUUklBTCcsXHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgUGxhbmV0IHtcclxuICAgIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcclxuICAgIHJlYWRvbmx5IHRyYWl0PzogVHJhaXRzO1xyXG4gICAgcmVhZG9ubHkgcmVzb3VyY2VzOiBudW1iZXI7XHJcbiAgICByZWFkb25seSBpbmZsdWVuY2U6IG51bWJlcjtcclxuICAgIHJlYWRvbmx5IGhvbWU/OiBzdHJpbmc7IC8vIGZhY3Rpb24gbmFtZVxyXG5cclxuICAgIC8vIFRlY2ggYm9udXNlc1xyXG4gICAgcmVhZG9ubHkgYmlvdGljPzogbnVtYmVyOyAvLyBncmVlblxyXG4gICAgcmVhZG9ubHkgd2FyZmFyZT86IG51bWJlcjsgLy9yZWRcclxuICAgIHJlYWRvbmx5IHByb3B1bHNpb24/OiBudW1iZXI7IC8vIGJsdWVcclxuICAgIHJlYWRvbmx5IGN5YmVybmV0aWM/OiBudW1iZXI7IC8vIHllbGxvd1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFBsYW5ldE1hcCB7XHJcbiAgICBbbmFtZTogc3RyaW5nXTogUGxhbmV0O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxhbmV0c0J5SWQocGxhbmV0czogUGxhbmV0TWFwLCBpZDogc3RyaW5nIHwgc3RyaW5nW10pOiBQbGFuZXRbXSB7XHJcbiAgICBjb25zdCBpZEFycmF5ID0gQXJyYXkuaXNBcnJheShpZCkgPyBpZCA6IFtpZF07XHJcblxyXG4gICAgY29uc3QgcGxhbmV0QXJyYXk6IFBsYW5ldFtdID0gW107XHJcbiAgICBpZEFycmF5LmZvckVhY2goaSA9PiB7XHJcbiAgICAgICAgY29uc3QgcGxhbmV0ID0gcGxhbmV0c1tpXTtcclxuICAgICAgICBpZiAocGxhbmV0KSB7XHJcbiAgICAgICAgICAgIHBsYW5ldEFycmF5LnB1c2gocGxhbmV0KTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gcGxhbmV0QXJyYXk7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFvQkE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/common/Planet.ts\n");

/***/ }),

/***/ "./src/common/error.ts":
/*!*****************************!*\
  !*** ./src/common/error.ts ***!
  \*****************************/
/*! exports provided: ErrorType */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"ErrorType\", function() { return ErrorType; });\nvar ErrorType;\r\n(function (ErrorType) {\r\n    ErrorType[\"INVALID_MESSAGE_TYPE\"] = \"Invalid message type\";\r\n    ErrorType[\"NO_GAME_STARTED\"] = \"No game started\";\r\n    ErrorType[\"GAME_NOT_FOUND\"] = \"Game not found\";\r\n    ErrorType[\"PLAYER_NOT_FOUND\"] = \"Player not found\";\r\n    ErrorType[\"GAME_UNABLE_TO_JOIN\"] = \"Unable to join, game has already started\";\r\n})(ErrorType || (ErrorType = {}));\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tbW9uL2Vycm9yLnRzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3NyYy9jb21tb24vZXJyb3IudHM/MGY0OCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZW51bSBFcnJvclR5cGUge1xyXG4gICAgSU5WQUxJRF9NRVNTQUdFX1RZUEUgPSAnSW52YWxpZCBtZXNzYWdlIHR5cGUnLFxyXG5cclxuICAgIE5PX0dBTUVfU1RBUlRFRCA9ICdObyBnYW1lIHN0YXJ0ZWQnLFxyXG5cclxuICAgIEdBTUVfTk9UX0ZPVU5EID0gJ0dhbWUgbm90IGZvdW5kJyxcclxuICAgIFBMQVlFUl9OT1RfRk9VTkQgPSAnUGxheWVyIG5vdCBmb3VuZCcsXHJcblxyXG4gICAgR0FNRV9VTkFCTEVfVE9fSk9JTiA9ICdVbmFibGUgdG8gam9pbiwgZ2FtZSBoYXMgYWxyZWFkeSBzdGFydGVkJyxcclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFFQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/common/error.ts\n");

/***/ }),

/***/ "./src/common/message.ts":
/*!*******************************!*\
  !*** ./src/common/message.ts ***!
  \*******************************/
/*! exports provided: MessageType */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"MessageType\", function() { return MessageType; });\nvar MessageType;\r\n(function (MessageType) {\r\n    // Account actions\r\n    // data: { accountId }\r\n    MessageType[\"LIST_ACCOUNTS\"] = \"/account/list\";\r\n    MessageType[\"ACCOUNT_LOGIN\"] = \"/account/login\";\r\n    MessageType[\"ACCOUNT_LOGOUT\"] = \"/account/logout\";\r\n    MessageType[\"ACCOUNT_ADD\"] = \"/account/add\";\r\n    MessageType[\"ACCOUNT_DELETE\"] = \"/account/delete\";\r\n    //\r\n    MessageType[\"STATE_ALL\"] = \"/state/all\";\r\n    MessageType[\"STATE_CHANGE\"] = \"/state/change\";\r\n    // Manage games actions\r\n    MessageType[\"LIST_GAMES\"] = \"/game/list\";\r\n    // data: { gameId }\r\n    MessageType[\"CREATE_GAME\"] = \"/game/create\";\r\n    MessageType[\"DELETE_GAME\"] = \"/game/delete\";\r\n    MessageType[\"START_GAME\"] = \"/game/start\";\r\n    MessageType[\"STOP_GAME\"] = \"/game/stop\";\r\n    MessageType[\"GAME_STATUS_SET\"] = \"/game/setStatus\";\r\n    // Faction actions\r\n    MessageType[\"FACTION_LIST_NAMES\"] = \"/faction/listNames\";\r\n    // data: { factionName }\r\n    MessageType[\"FACTION_GET\"] = \"/faction/get\";\r\n    // Player actions\r\n    // data: { gameId, playerId }\r\n    MessageType[\"PLAYER_JOIN_GAME\"] = \"/player/joinGame\";\r\n    MessageType[\"PLAYER_LEAVE_GAME\"] = \"/player/leaveGame\";\r\n    MessageType[\"PLAYER_SET_COLOR\"] = \"/player/setColor\";\r\n    MessageType[\"PLAYER_SET_FACTION\"] = \"/player/setFaction\";\r\n    // Strategy Card actions\r\n    // data: { gameId: string, playerId: string, strategyCard: number }\r\n    MessageType[\"PLAYER_TAKE_STRATEGY_CARD\"] = \"/player/takeStrategyCard\";\r\n    MessageType[\"PLAYER_RETURN_STRATEGY_CARD\"] = \"/player/returnStrategyCard\";\r\n    MessageType[\"PLAYER_USE_STRATEGY_CARD\"] = \"/player/useStrategyCard\";\r\n    MessageType[\"PLAYER_RESET_STRATEGY_CARDS\"] = \"/player/resetStrategyCards\";\r\n    // Planet actions\r\n    // data: { gameId, playerId, planetId }\r\n    MessageType[\"PLAYER_TAKE_PLANET\"] = \"/player/takePlanet\";\r\n    MessageType[\"PLAYER_LOST_PLANET\"] = \"/player/lostPlanet\";\r\n    MessageType[\"PLAYER_EXHAUST_PLANET\"] = \"/player/exhaustPlanet\";\r\n    MessageType[\"PLAYER_REFRESH_PLANET\"] = \"/player/refreshPlanet\";\r\n    //\r\n    MessageType[\"LIST_PLANETS\"] = \"/planet/list\";\r\n})(MessageType || (MessageType = {}));\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tbW9uL21lc3NhZ2UudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL2NvbW1vbi9tZXNzYWdlLnRzPzkwNjUiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgR2FtZUNoYW5nZURhdGFNYXAsIEdhbWVNYXAsIFN0cmF0ZWd5Q2FyZHNUeXBlIH0gZnJvbSAnLi9HYW1lJztcclxuaW1wb3J0IHsgUGxhbmV0TWFwIH0gZnJvbSAnY29tbW9uL1BsYW5ldCc7XHJcbmltcG9ydCB7IEFjY291bnRNYXAgfSBmcm9tICdjb21tb24vQWNjb3VudCc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIEFsbERhdGEge1xyXG4gICAgZ2FtZXM6IEdhbWVNYXA7XHJcbiAgICBhY2NvdW50czogQWNjb3VudE1hcDtcclxuICAgIHBsYW5ldHM6IFBsYW5ldE1hcDtcclxuICAgIHN0cmF0ZWd5Q2FyZHM6IFN0cmF0ZWd5Q2FyZHNUeXBlO1xyXG4gICAgZmFjdGlvbk5hbWVzOiByZWFkb25seSBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDaGFuZ2VEYXRhIHtcclxuICAgIGdhbWVzPzogR2FtZUNoYW5nZURhdGFNYXA7XHJcbiAgICBwbGFuZXRzPzogUGxhbmV0TWFwO1xyXG4gICAgYWNjb3VudHM/OiBBY2NvdW50TWFwO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIE1lc3NhZ2Uge1xyXG4gICAgdHlwZTogTWVzc2FnZVR5cGU7XHJcbiAgICBkYXRhPzogYW55O1xyXG59XHJcblxyXG5leHBvcnQgZW51bSBNZXNzYWdlVHlwZSB7XHJcbiAgICAvLyBBY2NvdW50IGFjdGlvbnNcclxuICAgIC8vIGRhdGE6IHsgYWNjb3VudElkIH1cclxuICAgIExJU1RfQUNDT1VOVFMgPSAnL2FjY291bnQvbGlzdCcsXHJcbiAgICBBQ0NPVU5UX0xPR0lOID0gJy9hY2NvdW50L2xvZ2luJyxcclxuICAgIEFDQ09VTlRfTE9HT1VUID0gJy9hY2NvdW50L2xvZ291dCcsXHJcbiAgICBBQ0NPVU5UX0FERCA9ICcvYWNjb3VudC9hZGQnLFxyXG4gICAgQUNDT1VOVF9ERUxFVEUgPSAnL2FjY291bnQvZGVsZXRlJyxcclxuXHJcbiAgICAvL1xyXG4gICAgU1RBVEVfQUxMID0gJy9zdGF0ZS9hbGwnLFxyXG4gICAgU1RBVEVfQ0hBTkdFID0gJy9zdGF0ZS9jaGFuZ2UnLFxyXG5cclxuICAgIC8vIE1hbmFnZSBnYW1lcyBhY3Rpb25zXHJcbiAgICBMSVNUX0dBTUVTID0gJy9nYW1lL2xpc3QnLFxyXG4gICAgLy8gZGF0YTogeyBnYW1lSWQgfVxyXG4gICAgQ1JFQVRFX0dBTUUgPSAnL2dhbWUvY3JlYXRlJyxcclxuICAgIERFTEVURV9HQU1FID0gJy9nYW1lL2RlbGV0ZScsXHJcbiAgICBTVEFSVF9HQU1FID0gJy9nYW1lL3N0YXJ0JyxcclxuICAgIFNUT1BfR0FNRSA9ICcvZ2FtZS9zdG9wJyxcclxuXHJcbiAgICBHQU1FX1NUQVRVU19TRVQgPSAnL2dhbWUvc2V0U3RhdHVzJyxcclxuXHJcbiAgICAvLyBGYWN0aW9uIGFjdGlvbnNcclxuICAgIEZBQ1RJT05fTElTVF9OQU1FUyA9ICcvZmFjdGlvbi9saXN0TmFtZXMnLFxyXG4gICAgLy8gZGF0YTogeyBmYWN0aW9uTmFtZSB9XHJcbiAgICBGQUNUSU9OX0dFVCA9ICcvZmFjdGlvbi9nZXQnLFxyXG5cclxuICAgIC8vIFBsYXllciBhY3Rpb25zXHJcbiAgICAvLyBkYXRhOiB7IGdhbWVJZCwgcGxheWVySWQgfVxyXG4gICAgUExBWUVSX0pPSU5fR0FNRSA9ICcvcGxheWVyL2pvaW5HYW1lJyxcclxuICAgIFBMQVlFUl9MRUFWRV9HQU1FID0gJy9wbGF5ZXIvbGVhdmVHYW1lJyxcclxuXHJcbiAgICBQTEFZRVJfU0VUX0NPTE9SID0gJy9wbGF5ZXIvc2V0Q29sb3InLFxyXG4gICAgUExBWUVSX1NFVF9GQUNUSU9OID0gJy9wbGF5ZXIvc2V0RmFjdGlvbicsXHJcblxyXG4gICAgLy8gU3RyYXRlZ3kgQ2FyZCBhY3Rpb25zXHJcbiAgICAvLyBkYXRhOiB7IGdhbWVJZDogc3RyaW5nLCBwbGF5ZXJJZDogc3RyaW5nLCBzdHJhdGVneUNhcmQ6IG51bWJlciB9XHJcbiAgICBQTEFZRVJfVEFLRV9TVFJBVEVHWV9DQVJEID0gJy9wbGF5ZXIvdGFrZVN0cmF0ZWd5Q2FyZCcsXHJcbiAgICBQTEFZRVJfUkVUVVJOX1NUUkFURUdZX0NBUkQgPSAnL3BsYXllci9yZXR1cm5TdHJhdGVneUNhcmQnLFxyXG4gICAgUExBWUVSX1VTRV9TVFJBVEVHWV9DQVJEID0gJy9wbGF5ZXIvdXNlU3RyYXRlZ3lDYXJkJyxcclxuICAgIFBMQVlFUl9SRVNFVF9TVFJBVEVHWV9DQVJEUyA9ICcvcGxheWVyL3Jlc2V0U3RyYXRlZ3lDYXJkcycsXHJcblxyXG4gICAgLy8gUGxhbmV0IGFjdGlvbnNcclxuICAgIC8vIGRhdGE6IHsgZ2FtZUlkLCBwbGF5ZXJJZCwgcGxhbmV0SWQgfVxyXG4gICAgUExBWUVSX1RBS0VfUExBTkVUID0gJy9wbGF5ZXIvdGFrZVBsYW5ldCcsIC8vIFBsYXllciBoYXMgdGFrZW4gbmV3IHBsYW5ldChzKVxyXG4gICAgUExBWUVSX0xPU1RfUExBTkVUID0gJy9wbGF5ZXIvbG9zdFBsYW5ldCcsIC8vIFBsYXllciBoYXMgbG9zdCBwbGFuZXQocylcclxuICAgIFBMQVlFUl9FWEhBVVNUX1BMQU5FVCA9ICcvcGxheWVyL2V4aGF1c3RQbGFuZXQnLFxyXG4gICAgUExBWUVSX1JFRlJFU0hfUExBTkVUID0gJy9wbGF5ZXIvcmVmcmVzaFBsYW5ldCcsXHJcblxyXG4gICAgLy9cclxuICAgIExJU1RfUExBTkVUUyA9ICcvcGxhbmV0L2xpc3QnLFxyXG59XHJcbiJdLCJtYXBwaW5ncyI6IkFBdUJBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/common/message.ts\n");

/***/ }),

/***/ "./src/common/uuidv4.ts":
/*!******************************!*\
  !*** ./src/common/uuidv4.ts ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return uuidv4; });\nfunction uuidv4() {\r\n    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {\r\n        const r = (Math.random() * 16) | 0, v = c == 'x' ? r : (r & 0x3) | 0x8;\r\n        return v.toString(16);\r\n    });\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvY29tbW9uL3V1aWR2NC50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvY29tbW9uL3V1aWR2NC50cz82YTBkIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHV1aWR2NCgpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgYyA9PiB7XHJcbiAgICAgICAgY29uc3QgciA9IChNYXRoLnJhbmRvbSgpICogMTYpIHwgMCxcclxuICAgICAgICAgICAgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzKSB8IDB4ODtcclxuICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICB9KTtcclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/common/uuidv4.ts\n");

/***/ }),

/***/ "./src/server/WebSocket.ts":
/*!*********************************!*\
  !*** ./src/server/WebSocket.ts ***!
  \*********************************/
/*! exports provided: sendData, broadcastChangeData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"sendData\", function() { return sendData; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"broadcastChangeData\", function() { return broadcastChangeData; });\n/* harmony import */ var _log__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./log */ \"./src/server/log.ts\");\n\r\n/**\r\n * Send data to one client\r\n */\r\nfunction sendData({ ws, type, data, error }) {\r\n    // log(`Sending to \"${ws.accountId || 'unknown'}:\"\\n`, data);\r\n    ws.send(JSON.stringify({ type, data, error }));\r\n}\r\n/**\r\n * Broadcast a message to all connected clients.\r\n */\r\nfunction broadcastChangeData({ wss, type, data, error }) {\r\n    Object(_log__WEBPACK_IMPORTED_MODULE_0__[\"default\"])('Broadcasting:\\n', data);\r\n    wss.clients.forEach((ws) => ws.send(JSON.stringify({ type, data, error })));\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL1dlYlNvY2tldC50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvc2VydmVyL1dlYlNvY2tldC50cz9kNzIxIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBXUyBmcm9tICd3cyc7XHJcblxyXG5pbXBvcnQgeyBNZXNzYWdlVHlwZSwgQ2hhbmdlRGF0YSB9IGZyb20gJ2NvbW1vbi9tZXNzYWdlJztcclxuaW1wb3J0IGxvZyBmcm9tICcuL2xvZyc7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIFdlYlNvY2tldFNlcnZlciBleHRlbmRzIFdTLlNlcnZlciB7fVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBXZWJTb2NrZXQgZXh0ZW5kcyBXUyB7XHJcbiAgICBpc0FsaXZlOiBib29sZWFuO1xyXG4gICAgYWNjb3VudElkPzogc3RyaW5nIHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBTZW5kRGF0YVBhcmFtcyB7XHJcbiAgICB3czogV1M7XHJcbiAgICB0eXBlOiBNZXNzYWdlVHlwZTtcclxuICAgIGRhdGE/OiBhbnk7XHJcbiAgICBlcnJvcj86IGFueTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNlbmQgZGF0YSB0byBvbmUgY2xpZW50XHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2VuZERhdGEoeyB3cywgdHlwZSwgZGF0YSwgZXJyb3IgfTogeyB3czogV2ViU29ja2V0OyB0eXBlOiBNZXNzYWdlVHlwZTsgZGF0YT86IGFueTsgZXJyb3I/OiBhbnkgfSkge1xyXG4gICAgLy8gbG9nKGBTZW5kaW5nIHRvIFwiJHt3cy5hY2NvdW50SWQgfHwgJ3Vua25vd24nfTpcIlxcbmAsIGRhdGEpO1xyXG4gICAgd3Muc2VuZChKU09OLnN0cmluZ2lmeSh7IHR5cGUsIGRhdGEsIGVycm9yIH0pKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBCcm9hZGNhc3RDaGFuZ2VEYXRhUGFyYW1zIHtcclxuICAgIHdzczogV2ViU29ja2V0U2VydmVyO1xyXG4gICAgdHlwZTogTWVzc2FnZVR5cGU7XHJcbiAgICBkYXRhPzogQ2hhbmdlRGF0YTtcclxuICAgIGVycm9yPzogYW55O1xyXG59XHJcblxyXG4vKipcclxuICogQnJvYWRjYXN0IGEgbWVzc2FnZSB0byBhbGwgY29ubmVjdGVkIGNsaWVudHMuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gYnJvYWRjYXN0Q2hhbmdlRGF0YSh7IHdzcywgdHlwZSwgZGF0YSwgZXJyb3IgfTogQnJvYWRjYXN0Q2hhbmdlRGF0YVBhcmFtcykge1xyXG4gICAgbG9nKCdCcm9hZGNhc3Rpbmc6XFxuJywgZGF0YSk7XHJcbiAgICB3c3MuY2xpZW50cy5mb3JFYWNoKCh3czogV1MpID0+IHdzLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlLCBkYXRhLCBlcnJvciB9KSkpO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6IkFBR0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQWdCQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBU0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/server/WebSocket.ts\n");

/***/ }),

/***/ "./src/server/WebSocketServer.ts":
/*!***************************************!*\
  !*** ./src/server/WebSocketServer.ts ***!
  \***************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return initialize; });\n/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! http */ \"http\");\n/* harmony import */ var http__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(http__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var ws__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ws */ \"ws\");\n/* harmony import */ var ws__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(ws__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var common_message__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/message */ \"./src/common/message.ts\");\n/* harmony import */ var _database_faction__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./database/faction */ \"./src/server/database/faction.ts\");\n/* harmony import */ var _database_game__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./database/game */ \"./src/server/database/game.ts\");\n/* harmony import */ var _database_account__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./database/account */ \"./src/server/database/account.ts\");\n/* harmony import */ var _database_planet__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./database/planet */ \"./src/server/database/planet.ts\");\n/* harmony import */ var _database_strategy__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./database/strategy */ \"./src/server/database/strategy.ts\");\n/* harmony import */ var _dirty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./dirty */ \"./src/server/dirty.ts\");\n/* harmony import */ var _handleMessage__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./handleMessage */ \"./src/server/handleMessage.ts\");\n/* harmony import */ var _WebSocket__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./WebSocket */ \"./src/server/WebSocket.ts\");\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\nlet wss;\r\nfunction onConnection({ wss, ws }) {\r\n    ws.isAlive = true;\r\n    ws.on('pong', () => (ws.isAlive = true));\r\n    ws.on('message', (message) => Object(_handleMessage__WEBPACK_IMPORTED_MODULE_9__[\"default\"])({ wss, ws, message }));\r\n    // TODO: Design a better way to initialize without sending everything.\r\n    // Send initial packet to client\r\n    const allData = {\r\n        games: _database_game__WEBPACK_IMPORTED_MODULE_4__[\"listGames\"](),\r\n        accounts: _database_account__WEBPACK_IMPORTED_MODULE_5__[\"listAccounts\"](),\r\n        planets: _database_planet__WEBPACK_IMPORTED_MODULE_6__[\"listPlanets\"](),\r\n        strategyCards: _database_strategy__WEBPACK_IMPORTED_MODULE_7__[\"listCards\"](),\r\n        factionNames: _database_faction__WEBPACK_IMPORTED_MODULE_3__[\"listFactionNames\"](),\r\n    };\r\n    Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type: common_message__WEBPACK_IMPORTED_MODULE_2__[\"MessageType\"].STATE_ALL, data: allData });\r\n}\r\nfunction initialize(app) {\r\n    if (wss) {\r\n        return wss;\r\n    }\r\n    // Create server for websocket connections\r\n    const server = http__WEBPACK_IMPORTED_MODULE_0___default.a.createServer(app);\r\n    wss = new ws__WEBPACK_IMPORTED_MODULE_1___default.a.Server({ server });\r\n    wss.on('connection', (ws) => onConnection({ wss, ws }));\r\n    // Keep connections alive\r\n    setInterval(() => {\r\n        if (!wss) {\r\n            return;\r\n        }\r\n        wss.clients.forEach((websocket) => {\r\n            const ws = websocket;\r\n            if (!ws.isAlive) {\r\n                console.log('Terminating websocket');\r\n                return ws.terminate();\r\n            }\r\n            ws.isAlive = false;\r\n            ws.ping(null, false);\r\n        });\r\n    }, 10000);\r\n    // Broadcast game state on an interval\r\n    setInterval(() => {\r\n        if (!Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"isDirty\"])()) {\r\n            return;\r\n        }\r\n        const data = {};\r\n        if (_dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].planets) {\r\n            data.planets = _database_planet__WEBPACK_IMPORTED_MODULE_6__[\"listPlanets\"]();\r\n        }\r\n        if (_dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts) {\r\n            data.accounts = _database_account__WEBPACK_IMPORTED_MODULE_5__[\"listAccounts\"]();\r\n        }\r\n        const dirtyGames = Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"getDirtyGameData\"])();\r\n        if (dirtyGames) {\r\n            data.games = dirtyGames;\r\n        }\r\n        Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"setDirty\"])(false);\r\n        Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"broadcastChangeData\"])({ wss, type: common_message__WEBPACK_IMPORTED_MODULE_2__[\"MessageType\"].STATE_CHANGE, data });\r\n    }, 1000);\r\n    server.listen(8080, () => {\r\n        console.log(`WebSocket server started on port: 8080`);\r\n    });\r\n    return wss;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL1dlYlNvY2tldFNlcnZlci50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvc2VydmVyL1dlYlNvY2tldFNlcnZlci50cz82ZGNkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBleHByZXNzIGZyb20gJ2V4cHJlc3MnO1xyXG5pbXBvcnQgaHR0cCBmcm9tICdodHRwJztcclxuaW1wb3J0IHdzIGZyb20gJ3dzJztcclxuXHJcbmltcG9ydCB7IENoYW5nZURhdGEsIE1lc3NhZ2VUeXBlLCBBbGxEYXRhIH0gZnJvbSAnY29tbW9uL21lc3NhZ2UnO1xyXG5cclxuaW1wb3J0ICogYXMgRmFjdGlvbkRCIGZyb20gJy4vZGF0YWJhc2UvZmFjdGlvbic7XHJcbmltcG9ydCAqIGFzIEdhbWVEQiBmcm9tICcuL2RhdGFiYXNlL2dhbWUnO1xyXG5pbXBvcnQgKiBhcyBBY2NvdW50REIgZnJvbSAnLi9kYXRhYmFzZS9hY2NvdW50JztcclxuaW1wb3J0ICogYXMgUGxhbmV0REIgZnJvbSAnLi9kYXRhYmFzZS9wbGFuZXQnO1xyXG5pbXBvcnQgKiBhcyBTdHJhdGVneURCIGZyb20gJy4vZGF0YWJhc2Uvc3RyYXRlZ3knO1xyXG5cclxuaW1wb3J0IHsgZGlydHksIGlzRGlydHksIHNldERpcnR5LCBnZXREaXJ0eUdhbWVEYXRhIH0gZnJvbSAnLi9kaXJ0eSc7XHJcbmltcG9ydCBoYW5kbGVNZXNzYWdlIGZyb20gJy4vaGFuZGxlTWVzc2FnZSc7XHJcbmltcG9ydCB7IFdlYlNvY2tldCwgV2ViU29ja2V0U2VydmVyLCBzZW5kRGF0YSwgYnJvYWRjYXN0Q2hhbmdlRGF0YSB9IGZyb20gJy4vV2ViU29ja2V0JztcclxuXHJcbmludGVyZmFjZSBPbkNvbm5lY3Rpb25QYXJhbSB7XHJcbiAgICB3c3M6IFdlYlNvY2tldFNlcnZlcjtcclxuICAgIHdzOiBXZWJTb2NrZXQ7XHJcbn1cclxuXHJcbmxldCB3c3M6IFdlYlNvY2tldFNlcnZlcjtcclxuXHJcbmZ1bmN0aW9uIG9uQ29ubmVjdGlvbih7IHdzcywgd3MgfTogT25Db25uZWN0aW9uUGFyYW0pIHtcclxuICAgIHdzLmlzQWxpdmUgPSB0cnVlO1xyXG5cclxuICAgIHdzLm9uKCdwb25nJywgKCkgPT4gKHdzLmlzQWxpdmUgPSB0cnVlKSk7XHJcbiAgICB3cy5vbignbWVzc2FnZScsIChtZXNzYWdlOiBzdHJpbmcpID0+IGhhbmRsZU1lc3NhZ2UoeyB3c3MsIHdzLCBtZXNzYWdlIH0pKTtcclxuXHJcbiAgICAvLyBUT0RPOiBEZXNpZ24gYSBiZXR0ZXIgd2F5IHRvIGluaXRpYWxpemUgd2l0aG91dCBzZW5kaW5nIGV2ZXJ5dGhpbmcuXHJcbiAgICAvLyBTZW5kIGluaXRpYWwgcGFja2V0IHRvIGNsaWVudFxyXG4gICAgY29uc3QgYWxsRGF0YTogQWxsRGF0YSA9IHtcclxuICAgICAgICBnYW1lczogR2FtZURCLmxpc3RHYW1lcygpLFxyXG4gICAgICAgIGFjY291bnRzOiBBY2NvdW50REIubGlzdEFjY291bnRzKCksXHJcbiAgICAgICAgcGxhbmV0czogUGxhbmV0REIubGlzdFBsYW5ldHMoKSxcclxuICAgICAgICBzdHJhdGVneUNhcmRzOiBTdHJhdGVneURCLmxpc3RDYXJkcygpLFxyXG4gICAgICAgIGZhY3Rpb25OYW1lczogRmFjdGlvbkRCLmxpc3RGYWN0aW9uTmFtZXMoKSxcclxuICAgIH07XHJcblxyXG4gICAgc2VuZERhdGEoeyB3cywgdHlwZTogTWVzc2FnZVR5cGUuU1RBVEVfQUxMLCBkYXRhOiBhbGxEYXRhIH0pO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBpbml0aWFsaXplKGFwcDogZXhwcmVzcy5BcHBsaWNhdGlvbikge1xyXG4gICAgaWYgKHdzcykge1xyXG4gICAgICAgIHJldHVybiB3c3M7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIHNlcnZlciBmb3Igd2Vic29ja2V0IGNvbm5lY3Rpb25zXHJcbiAgICBjb25zdCBzZXJ2ZXI6IGh0dHAuU2VydmVyID0gaHR0cC5jcmVhdGVTZXJ2ZXIoYXBwKTtcclxuXHJcbiAgICB3c3MgPSBuZXcgd3MuU2VydmVyKHsgc2VydmVyIH0pO1xyXG4gICAgd3NzLm9uKCdjb25uZWN0aW9uJywgKHdzOiBXZWJTb2NrZXQpID0+IG9uQ29ubmVjdGlvbih7IHdzcywgd3MgfSkpO1xyXG5cclxuICAgIC8vIEtlZXAgY29ubmVjdGlvbnMgYWxpdmVcclxuICAgIHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICBpZiAoIXdzcykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB3c3MuY2xpZW50cy5mb3JFYWNoKCh3ZWJzb2NrZXQ6IHdzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdzOiBXZWJTb2NrZXQgPSB3ZWJzb2NrZXQgYXMgV2ViU29ja2V0O1xyXG4gICAgICAgICAgICBpZiAoIXdzLmlzQWxpdmUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdUZXJtaW5hdGluZyB3ZWJzb2NrZXQnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB3cy50ZXJtaW5hdGUoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgd3MuaXNBbGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICB3cy5waW5nKG51bGwsIGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH0sIDEwMDAwKTtcclxuXHJcbiAgICAvLyBCcm9hZGNhc3QgZ2FtZSBzdGF0ZSBvbiBhbiBpbnRlcnZhbFxyXG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgIGlmICghaXNEaXJ0eSgpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGRhdGE6IENoYW5nZURhdGEgPSB7fTtcclxuICAgICAgICBpZiAoZGlydHkucGxhbmV0cykge1xyXG4gICAgICAgICAgICBkYXRhLnBsYW5ldHMgPSBQbGFuZXREQi5saXN0UGxhbmV0cygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGRpcnR5LmFjY291bnRzKSB7XHJcbiAgICAgICAgICAgIGRhdGEuYWNjb3VudHMgPSBBY2NvdW50REIubGlzdEFjY291bnRzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBkaXJ0eUdhbWVzID0gZ2V0RGlydHlHYW1lRGF0YSgpO1xyXG4gICAgICAgIGlmIChkaXJ0eUdhbWVzKSB7XHJcbiAgICAgICAgICAgIGRhdGEuZ2FtZXMgPSBkaXJ0eUdhbWVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0RGlydHkoZmFsc2UpO1xyXG5cclxuICAgICAgICBicm9hZGNhc3RDaGFuZ2VEYXRhKHsgd3NzLCB0eXBlOiBNZXNzYWdlVHlwZS5TVEFURV9DSEFOR0UsIGRhdGEgfSk7XHJcbiAgICB9LCAxMDAwKTtcclxuXHJcbiAgICBzZXJ2ZXIubGlzdGVuKDgwODAsICgpID0+IHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgV2ViU29ja2V0IHNlcnZlciBzdGFydGVkIG9uIHBvcnQ6IDgwODBgKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB3c3M7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBT0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBOyIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///./src/server/WebSocketServer.ts\n");

/***/ }),

/***/ "./src/server/appData.ts":
/*!*******************************!*\
  !*** ./src/server/appData.ts ***!
  \*******************************/
/*! exports provided: getHomeDir, default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getHomeDir\", function() { return getHomeDir; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return initialize; });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n\r\n\r\nfunction getHomeDir() {\r\n    return process.env.APPDATA || process.env.HOME || '';\r\n}\r\nfunction initialize() {\r\n    const homeDir = getHomeDir();\r\n    const appDir = homeDir && path__WEBPACK_IMPORTED_MODULE_1___default.a.join(homeDir, 'tight');\r\n    if (!appDir || !fs__WEBPACK_IMPORTED_MODULE_0___default.a.existsSync(appDir)) {\r\n        console.log(`Creating app directory at: \"${appDir}\"`);\r\n        fs__WEBPACK_IMPORTED_MODULE_0___default.a.mkdirSync(appDir);\r\n    }\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2FwcERhdGEudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL3NlcnZlci9hcHBEYXRhLnRzPzVkM2EiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0SG9tZURpcigpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHByb2Nlc3MuZW52LkFQUERBVEEgfHwgcHJvY2Vzcy5lbnYuSE9NRSB8fCAnJztcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGNvbnN0IGhvbWVEaXIgPSBnZXRIb21lRGlyKCk7XHJcbiAgICBjb25zdCBhcHBEaXIgPSBob21lRGlyICYmIHBhdGguam9pbihob21lRGlyLCAndGlnaHQnKTtcclxuXHJcbiAgICBpZiAoIWFwcERpciB8fCAhZnMuZXhpc3RzU3luYyhhcHBEaXIpKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coYENyZWF0aW5nIGFwcCBkaXJlY3RvcnkgYXQ6IFwiJHthcHBEaXJ9XCJgKTtcclxuICAgICAgICBmcy5ta2RpclN5bmMoYXBwRGlyKTtcclxuICAgIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/appData.ts\n");

/***/ }),

/***/ "./src/server/database/account.ts":
/*!****************************************!*\
  !*** ./src/server/database/account.ts ***!
  \****************************************/
/*! exports provided: initialize, listAccounts, addAccount, deleteAccount, getAccount, login, logout */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"initialize\", function() { return initialize; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listAccounts\", function() { return listAccounts; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"addAccount\", function() { return addAccount; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"deleteAccount\", function() { return deleteAccount; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getAccount\", function() { return getAccount; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"login\", function() { return login; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"logout\", function() { return logout; });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _appData__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../appData */ \"./src/server/appData.ts\");\n\r\n\r\n\r\nconst ACCOUNTS_FILE = path__WEBPACK_IMPORTED_MODULE_1___default.a.join(Object(_appData__WEBPACK_IMPORTED_MODULE_2__[\"getHomeDir\"])(), 'accounts.json');\r\nconsole.log(`accounts file: ${ACCOUNTS_FILE}`);\r\nlet _accounts = {};\r\nfunction initialize() {\r\n    if (_accounts) {\r\n        return;\r\n    }\r\n    const accountsData = fs__WEBPACK_IMPORTED_MODULE_0___default.a.existsSync(ACCOUNTS_FILE)\r\n        ? fs__WEBPACK_IMPORTED_MODULE_0___default.a.readFileSync(ACCOUNTS_FILE, { encoding: 'utf-8' })\r\n        : '{}';\r\n    _accounts = JSON.parse(accountsData);\r\n}\r\nfunction save() {\r\n    const data = JSON.stringify(_accounts);\r\n    // fs.writeFileSync(ACCOUNTS_FILE, data);\r\n}\r\nfunction listAccounts() {\r\n    return _accounts;\r\n}\r\nfunction addAccount(id) {\r\n    if (!id) {\r\n        return false;\r\n    }\r\n    if (!_accounts[id]) {\r\n        _accounts[id] = { id, name: id, loggedIn: true };\r\n    }\r\n    return true;\r\n}\r\nfunction deleteAccount(id) {\r\n    if (!id || !_accounts[id]) {\r\n        return false;\r\n    }\r\n    delete _accounts[id];\r\n    return true;\r\n}\r\nfunction getAccount(id) {\r\n    return _accounts[id] || null;\r\n}\r\nfunction login(id) {\r\n    if (!addAccount(id)) {\r\n        return false;\r\n    }\r\n    _accounts[id].loggedIn = true;\r\n    return true;\r\n}\r\nfunction logout(id) {\r\n    const account = _accounts[id];\r\n    if (!account) {\r\n        return false;\r\n    }\r\n    account.loggedIn = false;\r\n    account.joinedGame = null;\r\n    return true;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RhdGFiYXNlL2FjY291bnQudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL3NlcnZlci9kYXRhYmFzZS9hY2NvdW50LnRzPzM2ODMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgeyBBY2NvdW50LCBBY2NvdW50TWFwIH0gZnJvbSAnY29tbW9uL0FjY291bnQnO1xyXG5cclxuaW1wb3J0IHsgZ2V0SG9tZURpciB9IGZyb20gJy4uL2FwcERhdGEnO1xyXG5cclxuY29uc3QgQUNDT1VOVFNfRklMRSA9IHBhdGguam9pbihnZXRIb21lRGlyKCksICdhY2NvdW50cy5qc29uJyk7XHJcbmNvbnNvbGUubG9nKGBhY2NvdW50cyBmaWxlOiAke0FDQ09VTlRTX0ZJTEV9YCk7XHJcblxyXG5sZXQgX2FjY291bnRzOiBBY2NvdW50TWFwID0ge307XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGlmIChfYWNjb3VudHMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYWNjb3VudHNEYXRhOiBzdHJpbmcgPSBmcy5leGlzdHNTeW5jKEFDQ09VTlRTX0ZJTEUpXHJcbiAgICAgICAgPyBmcy5yZWFkRmlsZVN5bmMoQUNDT1VOVFNfRklMRSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KVxyXG4gICAgICAgIDogJ3t9JztcclxuXHJcbiAgICBfYWNjb3VudHMgPSBKU09OLnBhcnNlKGFjY291bnRzRGF0YSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBjb25zdCBkYXRhID0gSlNPTi5zdHJpbmdpZnkoX2FjY291bnRzKTtcclxuICAgIC8vIGZzLndyaXRlRmlsZVN5bmMoQUNDT1VOVFNfRklMRSwgZGF0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsaXN0QWNjb3VudHMoKSB7XHJcbiAgICByZXR1cm4gX2FjY291bnRzO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkQWNjb3VudChpZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoIWlkKSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghX2FjY291bnRzW2lkXSkge1xyXG4gICAgICAgIF9hY2NvdW50c1tpZF0gPSB7IGlkLCBuYW1lOiBpZCwgbG9nZ2VkSW46IHRydWUgfTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRlbGV0ZUFjY291bnQoaWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgaWYgKCFpZCB8fCAhX2FjY291bnRzW2lkXSkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBkZWxldGUgX2FjY291bnRzW2lkXTtcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QWNjb3VudChpZDogc3RyaW5nKTogQWNjb3VudCB8IG51bGwge1xyXG4gICAgcmV0dXJuIF9hY2NvdW50c1tpZF0gfHwgbnVsbDtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ2luKGlkOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgIGlmICghYWRkQWNjb3VudChpZCkpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgX2FjY291bnRzW2lkXS5sb2dnZWRJbiA9IHRydWU7XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxvZ291dChpZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICBjb25zdCBhY2NvdW50ID0gX2FjY291bnRzW2lkXTtcclxuICAgIGlmICghYWNjb3VudCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBhY2NvdW50LmxvZ2dlZEluID0gZmFsc2U7XHJcbiAgICBhY2NvdW50LmpvaW5lZEdhbWUgPSBudWxsO1xyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFJQTtBQUVBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/server/database/account.ts\n");

/***/ }),

/***/ "./src/server/database/faction.ts":
/*!****************************************!*\
  !*** ./src/server/database/faction.ts ***!
  \****************************************/
/*! exports provided: listFactions, listFactionNames, getFaction */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listFactions\", function() { return listFactions; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listFactionNames\", function() { return listFactionNames; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getFaction\", function() { return getFaction; });\nconst _factions = [\r\n    {\r\n        name: 'The Arborec',\r\n        abilities: [\r\n            {\r\n                name: 'Mitosis',\r\n                description: 'Your space docks cannot produce infantry.  At the start of the status phase , place 1 infantry from your reinforcements on any planet you control.',\r\n            },\r\n        ],\r\n        promissoryNote: {\r\n            name: 'Stymie',\r\n            description: \"ACTION: Place this card face up in your play area. While this card is in your play area, the Arborec player cannot produce units in or adjacent to non-home systems that contain 1 or more of your units. If you activate a system that contains 1 or more of the Arborec player's units, return this card to the Arborec player.\",\r\n        },\r\n        factionTech: [\r\n            {\r\n                name: 'Bioplasmosis',\r\n                description: 'At the end of the status phase , you may remove any number of infantry from planets you control and place them on 1 or more planets you control in the same or adjacent systems.',\r\n                requirements: {\r\n                    biotic: 2,\r\n                },\r\n            },\r\n        ],\r\n        startingUnits: {\r\n            carrier: 1,\r\n            cruiser: 1,\r\n            fighter: 2,\r\n            infantry: 4,\r\n            spaceDock: 1,\r\n            pds: 1,\r\n        },\r\n        startingTech: ['Magen Defense Grid'],\r\n        commodities: 3,\r\n        flagship: {\r\n            name: 'Duha Menaimon',\r\n            cost: 8,\r\n            combat: [7, 2],\r\n            move: 1,\r\n            capacity: 5,\r\n            abilities: [\r\n                'Sustain Damage',\r\n                'After you activate this system, you may produce up to 5 units in this system.',\r\n            ],\r\n        },\r\n    },\r\n    //\r\n    // TODO: Fill in faction details\r\n    //\r\n    {\r\n        name: 'The Barony of Letnev',\r\n        abilities: [\r\n            {\r\n                name: 'Munitions Reserves',\r\n                description: 'At the start of each round of space combat, you may spend 2 trade goods;  you may re-roll any number of your dice during that combat round.',\r\n            },\r\n        ],\r\n    },\r\n    {\r\n        name: 'The Clan of Saar',\r\n    },\r\n    {\r\n        name: 'The Embers of Muaat',\r\n    },\r\n    {\r\n        name: 'The Emirates of Hacan',\r\n    },\r\n    {\r\n        name: 'The Federation of Sol',\r\n    },\r\n    {\r\n        name: 'The Ghosts of Creuss',\r\n    },\r\n    {\r\n        name: 'The L1Z1X Mindnet',\r\n    },\r\n    {\r\n        name: 'The Mentak Coalition',\r\n    },\r\n    {\r\n        name: 'The Naalu Collective',\r\n    },\r\n    {\r\n        name: 'The Nekro Virus',\r\n    },\r\n    {\r\n        name: \"The Sardakk N'orr\",\r\n    },\r\n    {\r\n        name: 'The Universities of Jol-Nar',\r\n    },\r\n    {\r\n        name: 'The Winnu',\r\n    },\r\n    {\r\n        name: 'The Xxcha Kingdom',\r\n    },\r\n    {\r\n        name: 'The Yin Brotherhood',\r\n    },\r\n    {\r\n        name: 'The Yssaril Tribes',\r\n    },\r\n];\r\nconst _factionNames = _factions.map(f => f.name);\r\nfunction listFactions() {\r\n    return _factions;\r\n}\r\nfunction listFactionNames() {\r\n    return _factionNames;\r\n}\r\nfunction getFaction(name) {\r\n    const faction = _factions.find(f => f.name === name);\r\n    return faction || null;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RhdGFiYXNlL2ZhY3Rpb24udHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL3NlcnZlci9kYXRhYmFzZS9mYWN0aW9uLnRzPzk4ZTYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRmFjdGlvbiB9IGZyb20gJ2NvbW1vbi9GYWN0aW9uJztcclxuXHJcbmNvbnN0IF9mYWN0aW9uczogUmVhZG9ubHk8RmFjdGlvbltdPiA9IFtcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVGhlIEFyYm9yZWMnLFxyXG4gICAgICAgIGFiaWxpdGllczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnTWl0b3NpcycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgICAgICAgICAgICAnWW91ciBzcGFjZSBkb2NrcyBjYW5ub3QgcHJvZHVjZSBpbmZhbnRyeS4gIEF0IHRoZSBzdGFydCBvZiB0aGUgc3RhdHVzIHBoYXNlICwgcGxhY2UgMSBpbmZhbnRyeSBmcm9tIHlvdXIgcmVpbmZvcmNlbWVudHMgb24gYW55IHBsYW5ldCB5b3UgY29udHJvbC4nLFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcHJvbWlzc29yeU5vdGU6IHtcclxuICAgICAgICAgICAgbmFtZTogJ1N0eW1pZScsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOlxyXG4gICAgICAgICAgICAgICAgXCJBQ1RJT046IFBsYWNlIHRoaXMgY2FyZCBmYWNlIHVwIGluIHlvdXIgcGxheSBhcmVhLiBXaGlsZSB0aGlzIGNhcmQgaXMgaW4geW91ciBwbGF5IGFyZWEsIHRoZSBBcmJvcmVjIHBsYXllciBjYW5ub3QgcHJvZHVjZSB1bml0cyBpbiBvciBhZGphY2VudCB0byBub24taG9tZSBzeXN0ZW1zIHRoYXQgY29udGFpbiAxIG9yIG1vcmUgb2YgeW91ciB1bml0cy4gSWYgeW91IGFjdGl2YXRlIGEgc3lzdGVtIHRoYXQgY29udGFpbnMgMSBvciBtb3JlIG9mIHRoZSBBcmJvcmVjIHBsYXllcidzIHVuaXRzLCByZXR1cm4gdGhpcyBjYXJkIHRvIHRoZSBBcmJvcmVjIHBsYXllci5cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIGZhY3Rpb25UZWNoOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6ICdCaW9wbGFzbW9zaXMnLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246XHJcbiAgICAgICAgICAgICAgICAgICAgJ0F0IHRoZSBlbmQgb2YgdGhlIHN0YXR1cyBwaGFzZSAsIHlvdSBtYXkgcmVtb3ZlIGFueSBudW1iZXIgb2YgaW5mYW50cnkgZnJvbSBwbGFuZXRzIHlvdSBjb250cm9sIGFuZCBwbGFjZSB0aGVtIG9uIDEgb3IgbW9yZSBwbGFuZXRzIHlvdSBjb250cm9sIGluIHRoZSBzYW1lIG9yIGFkamFjZW50IHN5c3RlbXMuJyxcclxuICAgICAgICAgICAgICAgIHJlcXVpcmVtZW50czoge1xyXG4gICAgICAgICAgICAgICAgICAgIGJpb3RpYzogMixcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzdGFydGluZ1VuaXRzOiB7XHJcbiAgICAgICAgICAgIGNhcnJpZXI6IDEsXHJcbiAgICAgICAgICAgIGNydWlzZXI6IDEsXHJcbiAgICAgICAgICAgIGZpZ2h0ZXI6IDIsXHJcbiAgICAgICAgICAgIGluZmFudHJ5OiA0LFxyXG4gICAgICAgICAgICBzcGFjZURvY2s6IDEsXHJcbiAgICAgICAgICAgIHBkczogMSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN0YXJ0aW5nVGVjaDogWydNYWdlbiBEZWZlbnNlIEdyaWQnXSxcclxuICAgICAgICBjb21tb2RpdGllczogMyxcclxuICAgICAgICBmbGFnc2hpcDoge1xyXG4gICAgICAgICAgICBuYW1lOiAnRHVoYSBNZW5haW1vbicsXHJcbiAgICAgICAgICAgIGNvc3Q6IDgsXHJcbiAgICAgICAgICAgIGNvbWJhdDogWzcsIDJdLFxyXG4gICAgICAgICAgICBtb3ZlOiAxLFxyXG4gICAgICAgICAgICBjYXBhY2l0eTogNSxcclxuICAgICAgICAgICAgYWJpbGl0aWVzOiBbXHJcbiAgICAgICAgICAgICAgICAnU3VzdGFpbiBEYW1hZ2UnLFxyXG4gICAgICAgICAgICAgICAgJ0FmdGVyIHlvdSBhY3RpdmF0ZSB0aGlzIHN5c3RlbSwgeW91IG1heSBwcm9kdWNlIHVwIHRvIDUgdW5pdHMgaW4gdGhpcyBzeXN0ZW0uJyxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxuXHJcbiAgICAvL1xyXG4gICAgLy8gVE9ETzogRmlsbCBpbiBmYWN0aW9uIGRldGFpbHNcclxuICAgIC8vXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBCYXJvbnkgb2YgTGV0bmV2JyxcclxuICAgICAgICBhYmlsaXRpZXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ011bml0aW9ucyBSZXNlcnZlcycsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjpcclxuICAgICAgICAgICAgICAgICAgICAnQXQgdGhlIHN0YXJ0IG9mIGVhY2ggcm91bmQgb2Ygc3BhY2UgY29tYmF0LCB5b3UgbWF5IHNwZW5kIDIgdHJhZGUgZ29vZHM7ICB5b3UgbWF5IHJlLXJvbGwgYW55IG51bWJlciBvZiB5b3VyIGRpY2UgZHVyaW5nIHRoYXQgY29tYmF0IHJvdW5kLicsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBDbGFuIG9mIFNhYXInLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVGhlIEVtYmVycyBvZiBNdWFhdCcsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdUaGUgRW1pcmF0ZXMgb2YgSGFjYW4nLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVGhlIEZlZGVyYXRpb24gb2YgU29sJyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBHaG9zdHMgb2YgQ3JldXNzJyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBMMVoxWCBNaW5kbmV0JyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBNZW50YWsgQ29hbGl0aW9uJyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBOYWFsdSBDb2xsZWN0aXZlJyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBOZWtybyBWaXJ1cycsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6IFwiVGhlIFNhcmRha2sgTidvcnJcIixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RoZSBVbml2ZXJzaXRpZXMgb2YgSm9sLU5hcicsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdUaGUgV2lubnUnLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVGhlIFh4Y2hhIEtpbmdkb20nLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVGhlIFlpbiBCcm90aGVyaG9vZCcsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdUaGUgWXNzYXJpbCBUcmliZXMnLFxyXG4gICAgfSxcclxuXTtcclxuXHJcbmNvbnN0IF9mYWN0aW9uTmFtZXM6IFJlYWRvbmx5PHN0cmluZ1tdPiA9IF9mYWN0aW9ucy5tYXAoZiA9PiBmLm5hbWUpO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RGYWN0aW9ucygpIHtcclxuICAgIHJldHVybiBfZmFjdGlvbnM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsaXN0RmFjdGlvbk5hbWVzKCkge1xyXG4gICAgcmV0dXJuIF9mYWN0aW9uTmFtZXM7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0aW9uKG5hbWU6IHN0cmluZykge1xyXG4gICAgY29uc3QgZmFjdGlvbiA9IF9mYWN0aW9ucy5maW5kKGYgPT4gZi5uYW1lID09PSBuYW1lKTtcclxuICAgIHJldHVybiBmYWN0aW9uIHx8IG51bGw7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/database/faction.ts\n");

/***/ }),

/***/ "./src/server/database/game.ts":
/*!*************************************!*\
  !*** ./src/server/database/game.ts ***!
  \*************************************/
/*! exports provided: initialize, createGame, deleteGame, listGames, getGame, addPlayer, removePlayer, getPlanetsArray */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"initialize\", function() { return initialize; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"createGame\", function() { return createGame; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"deleteGame\", function() { return deleteGame; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listGames\", function() { return listGames; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getGame\", function() { return getGame; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"addPlayer\", function() { return addPlayer; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"removePlayer\", function() { return removePlayer; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getPlanetsArray\", function() { return getPlanetsArray; });\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fs */ \"fs\");\n/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var lodash_cloneDeep__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash/cloneDeep */ \"lodash/cloneDeep\");\n/* harmony import */ var lodash_cloneDeep__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash_cloneDeep__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var lodash_uniqueId__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash/uniqueId */ \"lodash/uniqueId\");\n/* harmony import */ var lodash_uniqueId__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash_uniqueId__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var common_Game__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! common/Game */ \"./src/common/Game.ts\");\n/* harmony import */ var common_uuidv4__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! common/uuidv4 */ \"./src/common/uuidv4.ts\");\n/* harmony import */ var _appData__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../appData */ \"./src/server/appData.ts\");\n/* harmony import */ var _planet__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./planet */ \"./src/server/database/planet.ts\");\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\nconst GAMES_FILE = path__WEBPACK_IMPORTED_MODULE_1___default.a.join(Object(_appData__WEBPACK_IMPORTED_MODULE_6__[\"getHomeDir\"])(), 'games.json');\r\nconsole.log(`games file: ${GAMES_FILE}`);\r\n// Map of all games\r\nlet _games = {};\r\n// Default setting for all planets in a new game\r\nconst DEFAULT_GAME_PLANETS = _planet__WEBPACK_IMPORTED_MODULE_7__[\"Planets\"].reduce((result, planet) => {\r\n    const { name } = planet;\r\n    result[name] = { name, owner: null, refreshed: false };\r\n    return result;\r\n}, {});\r\nfunction initialize() {\r\n    if (_games) {\r\n        return;\r\n    }\r\n    const gameData = fs__WEBPACK_IMPORTED_MODULE_0___default.a.existsSync(GAMES_FILE) ? fs__WEBPACK_IMPORTED_MODULE_0___default.a.readFileSync(GAMES_FILE, { encoding: 'utf-8' }) : '{}';\r\n    _games = JSON.parse(gameData);\r\n}\r\nfunction save() {\r\n    const data = JSON.stringify(_games);\r\n    // fs.writeFileSync(GAMES_FILE, data);\r\n}\r\nfunction createGame({ creator, version = common_Game__WEBPACK_IMPORTED_MODULE_4__[\"Version\"].TI4, name }) {\r\n    const game = {\r\n        id: `game:${Object(common_uuidv4__WEBPACK_IMPORTED_MODULE_5__[\"default\"])()}`,\r\n        date: Date.now(),\r\n        name: name || `Game${lodash_uniqueId__WEBPACK_IMPORTED_MODULE_3___default()()}`,\r\n        version,\r\n        creator,\r\n        players: {},\r\n        planets: lodash_cloneDeep__WEBPACK_IMPORTED_MODULE_2___default()(DEFAULT_GAME_PLANETS),\r\n        status: {\r\n            started: false,\r\n            round: 1,\r\n            phase: common_Game__WEBPACK_IMPORTED_MODULE_4__[\"Phase\"].STRATEGY,\r\n            speaker: creator,\r\n            pickOrder: [creator],\r\n            pickTurn: 0,\r\n        },\r\n        started: false,\r\n    };\r\n    if (_games) {\r\n        _games[game.id] = game;\r\n    }\r\n    else {\r\n        _games = { [game.id]: game };\r\n    }\r\n    return game;\r\n}\r\nfunction deleteGame(id) {\r\n    if (_games && _games[id]) {\r\n        delete _games[id];\r\n        return true;\r\n    }\r\n    return false;\r\n}\r\nfunction listGames() {\r\n    return _games;\r\n}\r\nfunction getGame(id) {\r\n    return id ? _games[id] : null;\r\n}\r\nfunction addPlayer(gameId, playerId) {\r\n    const game = getGame(gameId);\r\n    if (!game) {\r\n        return;\r\n    }\r\n    // Initialize all players added to the game.\r\n    const playeridArray = Array.isArray(playerId) ? playerId : [playerId];\r\n    playeridArray.forEach(pid => {\r\n        if (!game.players[pid]) {\r\n            game.players[pid] = {\r\n                id: pid,\r\n                name: pid,\r\n                joined: true,\r\n                strategyCard: common_Game__WEBPACK_IMPORTED_MODULE_4__[\"StrategyCardIndex\"].NONE,\r\n                strategyCardTaken: false,\r\n                stragetyCardUsed: false,\r\n                passed: false,\r\n                planets: [],\r\n                victoryPoints: 0,\r\n            };\r\n        }\r\n        else {\r\n            game.players[pid].joined = true;\r\n        }\r\n    });\r\n}\r\nfunction removePlayer(gameId, playerId, deletePlayer = false) {\r\n    const game = getGame(gameId);\r\n    if (!game) {\r\n        return;\r\n    }\r\n    const playeridArray = Array.isArray(playerId) ? playerId : [playerId];\r\n    playeridArray.forEach(pid => {\r\n        if (deletePlayer) {\r\n            delete game.players[pid];\r\n        }\r\n        else if (game.players[pid]) {\r\n            game.players[pid].joined = false;\r\n        }\r\n    });\r\n}\r\nfunction getPlanetsArray(gameId, name) {\r\n    const game = getGame(gameId);\r\n    if (!game) {\r\n        return [];\r\n    }\r\n    let nameArray = null;\r\n    if (name) {\r\n        nameArray = Array.isArray(name) ? name : [name];\r\n    }\r\n    const planetMap = game.planets;\r\n    if (!planetMap) {\r\n        return [];\r\n    }\r\n    const result = nameArray ? nameArray.map(n => planetMap[n]) : Object.values(planetMap);\r\n    return result;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RhdGFiYXNlL2dhbWUudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL3NlcnZlci9kYXRhYmFzZS9nYW1lLnRzPzg1ZmYiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGZzIGZyb20gJ2ZzJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcblxyXG5pbXBvcnQgY2xvbmVEZWVwIGZyb20gJ2xvZGFzaC9jbG9uZURlZXAnO1xyXG5pbXBvcnQgdW5pcXVlSWQgZnJvbSAnbG9kYXNoL3VuaXF1ZUlkJztcclxuXHJcbmltcG9ydCB7XHJcbiAgICBHYW1lLFxyXG4gICAgR2FtZU1hcCxcclxuICAgIEdhbWVQbGFuZXQsXHJcbiAgICBHYW1lUGxhbmV0TWFwLFxyXG4gICAgR2FtZVBsYXllck1hcCxcclxuICAgIEdhbWVTdGF0dXMsXHJcbiAgICBQaGFzZSxcclxuICAgIFN0cmF0ZWd5Q2FyZEluZGV4LFxyXG4gICAgVmVyc2lvbixcclxufSBmcm9tICdjb21tb24vR2FtZSc7XHJcbmltcG9ydCB1dWlkdjQgZnJvbSAnY29tbW9uL3V1aWR2NCc7XHJcblxyXG5pbXBvcnQgeyBnZXRIb21lRGlyIH0gZnJvbSAnLi4vYXBwRGF0YSc7XHJcbmltcG9ydCB7IFBsYW5ldHMgfSBmcm9tICcuL3BsYW5ldCc7XHJcbmltcG9ydCB7IFBsYW5ldCB9IGZyb20gJ2NvbW1vbi9QbGFuZXQnO1xyXG5cclxuY29uc3QgR0FNRVNfRklMRSA9IHBhdGguam9pbihnZXRIb21lRGlyKCksICdnYW1lcy5qc29uJyk7XHJcbmNvbnNvbGUubG9nKGBnYW1lcyBmaWxlOiAke0dBTUVTX0ZJTEV9YCk7XHJcblxyXG4vLyBNYXAgb2YgYWxsIGdhbWVzXHJcbmxldCBfZ2FtZXM6IEdhbWVNYXAgPSB7fTtcclxuXHJcbi8vIERlZmF1bHQgc2V0dGluZyBmb3IgYWxsIHBsYW5ldHMgaW4gYSBuZXcgZ2FtZVxyXG5jb25zdCBERUZBVUxUX0dBTUVfUExBTkVUUzogUmVhZG9ubHk8R2FtZVBsYW5ldE1hcD4gPSBQbGFuZXRzLnJlZHVjZSgocmVzdWx0OiBHYW1lUGxhbmV0TWFwLCBwbGFuZXQ6IFBsYW5ldCkgPT4ge1xyXG4gICAgY29uc3QgeyBuYW1lIH0gPSBwbGFuZXQ7XHJcbiAgICByZXN1bHRbbmFtZV0gPSB7IG5hbWUsIG93bmVyOiBudWxsLCByZWZyZXNoZWQ6IGZhbHNlIH07XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59LCB7fSk7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZSgpIHtcclxuICAgIGlmIChfZ2FtZXMpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZ2FtZURhdGE6IHN0cmluZyA9IGZzLmV4aXN0c1N5bmMoR0FNRVNfRklMRSkgPyBmcy5yZWFkRmlsZVN5bmMoR0FNRVNfRklMRSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KSA6ICd7fSc7XHJcblxyXG4gICAgX2dhbWVzID0gSlNPTi5wYXJzZShnYW1lRGF0YSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNhdmUoKSB7XHJcbiAgICBjb25zdCBkYXRhID0gSlNPTi5zdHJpbmdpZnkoX2dhbWVzKTtcclxuICAgIC8vIGZzLndyaXRlRmlsZVN5bmMoR0FNRVNfRklMRSwgZGF0YSk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlR2FtZVBhcmFtcyB7XHJcbiAgICBjcmVhdG9yOiBzdHJpbmc7XHJcbiAgICB2ZXJzaW9uOiBWZXJzaW9uO1xyXG4gICAgbmFtZT86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUdhbWUoeyBjcmVhdG9yLCB2ZXJzaW9uID0gVmVyc2lvbi5USTQsIG5hbWUgfTogQ3JlYXRlR2FtZVBhcmFtcyk6IEdhbWUge1xyXG4gICAgY29uc3QgZ2FtZSA9IHtcclxuICAgICAgICBpZDogYGdhbWU6JHt1dWlkdjQoKX1gLFxyXG4gICAgICAgIGRhdGU6IERhdGUubm93KCksXHJcbiAgICAgICAgbmFtZTogbmFtZSB8fCBgR2FtZSR7dW5pcXVlSWQoKX1gLFxyXG4gICAgICAgIHZlcnNpb24sXHJcbiAgICAgICAgY3JlYXRvcixcclxuICAgICAgICBwbGF5ZXJzOiB7fSBhcyBHYW1lUGxheWVyTWFwLFxyXG4gICAgICAgIHBsYW5ldHM6IGNsb25lRGVlcChERUZBVUxUX0dBTUVfUExBTkVUUykgYXMgR2FtZVBsYW5ldE1hcCxcclxuICAgICAgICBzdGF0dXM6IHtcclxuICAgICAgICAgICAgc3RhcnRlZDogZmFsc2UsXHJcbiAgICAgICAgICAgIHJvdW5kOiAxLFxyXG4gICAgICAgICAgICBwaGFzZTogUGhhc2UuU1RSQVRFR1ksXHJcbiAgICAgICAgICAgIHNwZWFrZXI6IGNyZWF0b3IsXHJcbiAgICAgICAgICAgIHBpY2tPcmRlcjogW2NyZWF0b3JdLFxyXG4gICAgICAgICAgICBwaWNrVHVybjogMCxcclxuICAgICAgICB9IGFzIEdhbWVTdGF0dXMsXHJcbiAgICAgICAgc3RhcnRlZDogZmFsc2UsXHJcbiAgICB9O1xyXG5cclxuICAgIGlmIChfZ2FtZXMpIHtcclxuICAgICAgICBfZ2FtZXNbZ2FtZS5pZF0gPSBnYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBfZ2FtZXMgPSB7IFtnYW1lLmlkXTogZ2FtZSB9O1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBnYW1lO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGVsZXRlR2FtZShpZDogc3RyaW5nKTogYm9vbGVhbiB7XHJcbiAgICBpZiAoX2dhbWVzICYmIF9nYW1lc1tpZF0pIHtcclxuICAgICAgICBkZWxldGUgX2dhbWVzW2lkXTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBsaXN0R2FtZXMoKTogUmVhZG9ubHk8R2FtZU1hcD4ge1xyXG4gICAgcmV0dXJuIF9nYW1lcyBhcyBSZWFkb25seTxHYW1lTWFwPjtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEdhbWUoaWQ6IHN0cmluZyk6IEdhbWUgfCBudWxsIHtcclxuICAgIHJldHVybiBpZCA/IF9nYW1lc1tpZF0gOiBudWxsO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVyKGdhbWVJZDogc3RyaW5nLCBwbGF5ZXJJZDogc3RyaW5nIHwgc3RyaW5nW10pIHtcclxuICAgIGNvbnN0IGdhbWUgPSBnZXRHYW1lKGdhbWVJZCk7XHJcbiAgICBpZiAoIWdhbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW5pdGlhbGl6ZSBhbGwgcGxheWVycyBhZGRlZCB0byB0aGUgZ2FtZS5cclxuICAgIGNvbnN0IHBsYXllcmlkQXJyYXkgPSBBcnJheS5pc0FycmF5KHBsYXllcklkKSA/IHBsYXllcklkIDogW3BsYXllcklkXTtcclxuICAgIHBsYXllcmlkQXJyYXkuZm9yRWFjaChwaWQgPT4ge1xyXG4gICAgICAgIGlmICghZ2FtZS5wbGF5ZXJzW3BpZF0pIHtcclxuICAgICAgICAgICAgZ2FtZS5wbGF5ZXJzW3BpZF0gPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogcGlkLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogcGlkLFxyXG4gICAgICAgICAgICAgICAgam9pbmVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RyYXRlZ3lDYXJkOiBTdHJhdGVneUNhcmRJbmRleC5OT05FLFxyXG4gICAgICAgICAgICAgICAgc3RyYXRlZ3lDYXJkVGFrZW46IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3RyYWdldHlDYXJkVXNlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBwYXNzZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcGxhbmV0czogW10sXHJcbiAgICAgICAgICAgICAgICB2aWN0b3J5UG9pbnRzOiAwLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGdhbWUucGxheWVyc1twaWRdLmpvaW5lZCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVQbGF5ZXIoZ2FtZUlkOiBzdHJpbmcsIHBsYXllcklkOiBzdHJpbmcgfCBzdHJpbmdbXSwgZGVsZXRlUGxheWVyOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgIGNvbnN0IGdhbWUgPSBnZXRHYW1lKGdhbWVJZCk7XHJcbiAgICBpZiAoIWdhbWUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGxheWVyaWRBcnJheSA9IEFycmF5LmlzQXJyYXkocGxheWVySWQpID8gcGxheWVySWQgOiBbcGxheWVySWRdO1xyXG4gICAgcGxheWVyaWRBcnJheS5mb3JFYWNoKHBpZCA9PiB7XHJcbiAgICAgICAgaWYgKGRlbGV0ZVBsYXllcikge1xyXG4gICAgICAgICAgICBkZWxldGUgZ2FtZS5wbGF5ZXJzW3BpZF07XHJcbiAgICAgICAgfSBlbHNlIGlmIChnYW1lLnBsYXllcnNbcGlkXSkge1xyXG4gICAgICAgICAgICBnYW1lLnBsYXllcnNbcGlkXS5qb2luZWQgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYW5ldHNBcnJheShnYW1lSWQ6IHN0cmluZywgbmFtZT86IHN0cmluZyB8IHN0cmluZ1tdKTogR2FtZVBsYW5ldFtdIHtcclxuICAgIGNvbnN0IGdhbWUgPSBnZXRHYW1lKGdhbWVJZCk7XHJcbiAgICBpZiAoIWdhbWUpIHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IG5hbWVBcnJheSA9IG51bGw7XHJcbiAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIG5hbWVBcnJheSA9IEFycmF5LmlzQXJyYXkobmFtZSkgPyBuYW1lIDogW25hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBsYW5ldE1hcCA9IGdhbWUucGxhbmV0cztcclxuICAgIGlmICghcGxhbmV0TWFwKSB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHJlc3VsdCA9IG5hbWVBcnJheSA/IG5hbWVBcnJheS5tYXAobiA9PiBwbGFuZXRNYXBbbl0pIDogT2JqZWN0LnZhbHVlcyhwbGFuZXRNYXApO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFXQTtBQUVBO0FBQ0E7QUFHQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/server/database/game.ts\n");

/***/ }),

/***/ "./src/server/database/planet.ts":
/*!***************************************!*\
  !*** ./src/server/database/planet.ts ***!
  \***************************************/
/*! exports provided: Planets, PlanetsMap, listPlanets, getFactionPlanets */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"Planets\", function() { return Planets; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"PlanetsMap\", function() { return PlanetsMap; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listPlanets\", function() { return listPlanets; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getFactionPlanets\", function() { return getFactionPlanets; });\n/* harmony import */ var common_Planet__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! common/Planet */ \"./src/common/Planet.ts\");\n\r\nconst Planets = [\r\n    //\r\n    // Home planets\r\n    //\r\n    {\r\n        name: 'Nestphar',\r\n        home: 'The Arborec',\r\n        resources: 3,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Creuss',\r\n        home: 'The Ghosts of Creuss',\r\n        resources: 4,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Hercant',\r\n        home: 'The Emirates of Hacan',\r\n        resources: 1,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Arretze',\r\n        home: 'The Emirates of Hacan',\r\n        resources: 2,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Kamdorn',\r\n        home: 'The Emirates of Hacan',\r\n        resources: 0,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Jol',\r\n        home: 'The Universities of Jol-Nar',\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Nar',\r\n        home: 'The Universities of Jol-Nar',\r\n        resources: 2,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: '[0.0.0]',\r\n        home: 'The L1Z1X Mindnet',\r\n        resources: 5,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Arc Prime',\r\n        home: 'The Barony of Letnev',\r\n        resources: 4,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Wren Terra',\r\n        home: 'The Barony of Letnev',\r\n        resources: 2,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Moll Primus',\r\n        home: 'The Mentak Coalition',\r\n        resources: 4,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Muaat',\r\n        home: 'The Embers of Muaat',\r\n        resources: 4,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Druaa',\r\n        home: 'The Naalu Collective',\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Maaluuk',\r\n        home: 'The Naalu Collective',\r\n        resources: 0,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Mordai II',\r\n        home: 'The Nekro Virus',\r\n        resources: 4,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Lisis II',\r\n        home: 'The Clan of Saar',\r\n        resources: 1,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Ragh',\r\n        home: 'The Clan of Saar',\r\n        resources: 2,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: \"Tren'Lak\",\r\n        home: \"The Sardakk N'orr\",\r\n        resources: 1,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Quinarra',\r\n        home: \"The Sardakk N'orr\",\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Jord',\r\n        home: 'The Federation of Sol',\r\n        resources: 4,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Winnu',\r\n        home: 'The Winnu',\r\n        resources: 3,\r\n        influence: 4,\r\n    },\r\n    {\r\n        name: 'Archon Ren',\r\n        home: 'The Xxcha Kingdom',\r\n        resources: 2,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Archon Tau',\r\n        home: 'The Xxcha Kingdom',\r\n        resources: 1,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Darien',\r\n        home: 'The Yin Brotherhood',\r\n        resources: 4,\r\n        influence: 4,\r\n    },\r\n    {\r\n        name: 'Retillion',\r\n        home: 'The Yssaril Tribes',\r\n        resources: 2,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Shalloq',\r\n        home: 'The Yssaril Tribes',\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    //\r\n    // Other planets\r\n    //\r\n    {\r\n        name: 'Mecatol Rex',\r\n        resources: 1,\r\n        influence: 6,\r\n    },\r\n    {\r\n        name: 'Abyz',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 3,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Fria',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 2,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Arinam',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Meer',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 0,\r\n        influence: 4,\r\n        warfare: 1,\r\n    },\r\n    {\r\n        name: 'Arnor',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Lor',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 2,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Bereg',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Lirta IV',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 2,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Centauri',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 1,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Gral',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 1,\r\n        propulsion: 1,\r\n    },\r\n    {\r\n        name: 'Coorneeq',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Rescuion',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 2,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Dal Bootha',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 0,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Xxehan',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 1,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Lazar',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 0,\r\n        cybernetic: 1,\r\n    },\r\n    {\r\n        name: 'Sakulag',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 2,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Lodor',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Mehar Xull',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 1,\r\n        influence: 3,\r\n        warfare: 1,\r\n    },\r\n    {\r\n        name: 'Mellon',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 0,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Zhobat',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'New Albion',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 1,\r\n        biotic: 1,\r\n    },\r\n    {\r\n        name: 'Starpoint',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 3,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: 'Quann',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 2,\r\n        influence: 1,\r\n    },\r\n    {\r\n        name: \"Qucen'n\",\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Rarron',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 0,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Saudor',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 2,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: \"Tar'Mann\",\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 1,\r\n        biotic: 1,\r\n    },\r\n    {\r\n        name: \"Tequ'ran\",\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 2,\r\n        influence: 0,\r\n    },\r\n    {\r\n        name: 'Torkan',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].CULTURAL,\r\n        resources: 0,\r\n        influence: 3,\r\n    },\r\n    {\r\n        name: 'Thibah',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 1,\r\n        propulsion: 1,\r\n    },\r\n    {\r\n        name: 'Vefut II',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].HAZARDOUS,\r\n        resources: 2,\r\n        influence: 2,\r\n    },\r\n    {\r\n        name: 'Wellon',\r\n        trait: common_Planet__WEBPACK_IMPORTED_MODULE_0__[\"Traits\"].INDUSTRIAL,\r\n        resources: 1,\r\n        influence: 2,\r\n        cybernetic: 1,\r\n    },\r\n].sort((aa, bb) => {\r\n    // Sort alphabetically\r\n    const a = aa.name.toLowerCase();\r\n    const b = bb.name.toLowerCase();\r\n    if (a === b) {\r\n        return 0;\r\n    }\r\n    return a < b ? -1 : 1;\r\n});\r\nconst PlanetsMap = Planets.reduce((m, p) => {\r\n    m[p.name] = p;\r\n    return m;\r\n}, {});\r\nfunction listPlanets() {\r\n    return PlanetsMap;\r\n}\r\nfunction getFactionPlanets(name) {\r\n    if (!name) {\r\n        return [];\r\n    }\r\n    return Planets.filter(p => p.home === name);\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RhdGFiYXNlL3BsYW5ldC50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvc2VydmVyL2RhdGFiYXNlL3BsYW5ldC50cz9iZTBjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBsYW5ldCwgUGxhbmV0TWFwLCBUcmFpdHMgfSBmcm9tICdjb21tb24vUGxhbmV0JztcclxuXHJcbmV4cG9ydCBjb25zdCBQbGFuZXRzOiByZWFkb25seSBQbGFuZXRbXSA9IFtcclxuICAgIC8vXHJcbiAgICAvLyBIb21lIHBsYW5ldHNcclxuICAgIC8vXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ05lc3RwaGFyJyxcclxuICAgICAgICBob21lOiAnVGhlIEFyYm9yZWMnLFxyXG4gICAgICAgIHJlc291cmNlczogMyxcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdDcmV1c3MnLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgR2hvc3RzIG9mIENyZXVzcycsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA0LFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0hlcmNhbnQnLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgRW1pcmF0ZXMgb2YgSGFjYW4nLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdBcnJldHplJyxcclxuICAgICAgICBob21lOiAnVGhlIEVtaXJhdGVzIG9mIEhhY2FuJyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnS2FtZG9ybicsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBFbWlyYXRlcyBvZiBIYWNhbicsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAwLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0pvbCcsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBVbml2ZXJzaXRpZXMgb2YgSm9sLU5hcicsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ05hcicsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBVbml2ZXJzaXRpZXMgb2YgSm9sLU5hcicsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1swLjAuMF0nLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgTDFaMVggTWluZG5ldCcsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA1LFxyXG4gICAgICAgIGluZmx1ZW5jZTogMCxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0FyYyBQcmltZScsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBCYXJvbnkgb2YgTGV0bmV2JyxcclxuICAgICAgICByZXNvdXJjZXM6IDQsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnV3JlbiBUZXJyYScsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBCYXJvbnkgb2YgTGV0bmV2JyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnTW9sbCBQcmltdXMnLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgTWVudGFrIENvYWxpdGlvbicsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA0LFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ011YWF0JyxcclxuICAgICAgICBob21lOiAnVGhlIEVtYmVycyBvZiBNdWFhdCcsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA0LFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0RydWFhJyxcclxuICAgICAgICBob21lOiAnVGhlIE5hYWx1IENvbGxlY3RpdmUnLFxyXG4gICAgICAgIHJlc291cmNlczogMyxcclxuICAgICAgICBpbmZsdWVuY2U6IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdNYWFsdXVrJyxcclxuICAgICAgICBob21lOiAnVGhlIE5hYWx1IENvbGxlY3RpdmUnLFxyXG4gICAgICAgIHJlc291cmNlczogMCxcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdNb3JkYWkgSUknLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgTmVrcm8gVmlydXMnLFxyXG4gICAgICAgIHJlc291cmNlczogNCxcclxuICAgICAgICBpbmZsdWVuY2U6IDAsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdMaXNpcyBJSScsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBDbGFuIG9mIFNhYXInLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDAsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdSYWdoJyxcclxuICAgICAgICBob21lOiAnVGhlIENsYW4gb2YgU2FhcicsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogXCJUcmVuJ0xha1wiLFxyXG4gICAgICAgIGhvbWU6IFwiVGhlIFNhcmRha2sgTidvcnJcIixcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnUXVpbmFycmEnLFxyXG4gICAgICAgIGhvbWU6IFwiVGhlIFNhcmRha2sgTidvcnJcIixcclxuICAgICAgICByZXNvdXJjZXM6IDMsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnSm9yZCcsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBGZWRlcmF0aW9uIG9mIFNvbCcsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA0LFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1dpbm51JyxcclxuICAgICAgICBob21lOiAnVGhlIFdpbm51JyxcclxuICAgICAgICByZXNvdXJjZXM6IDMsXHJcbiAgICAgICAgaW5mbHVlbmNlOiA0LFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnQXJjaG9uIFJlbicsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBYeGNoYSBLaW5nZG9tJyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAzLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnQXJjaG9uIFRhdScsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBYeGNoYSBLaW5nZG9tJyxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnRGFyaWVuJyxcclxuICAgICAgICBob21lOiAnVGhlIFlpbiBCcm90aGVyaG9vZCcsXHJcbiAgICAgICAgcmVzb3VyY2VzOiA0LFxyXG4gICAgICAgIGluZmx1ZW5jZTogNCxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1JldGlsbGlvbicsXHJcbiAgICAgICAgaG9tZTogJ1RoZSBZc3NhcmlsIFRyaWJlcycsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1NoYWxsb3EnLFxyXG4gICAgICAgIGhvbWU6ICdUaGUgWXNzYXJpbCBUcmliZXMnLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICB9LFxyXG5cclxuICAgIC8vXHJcbiAgICAvLyBPdGhlciBwbGFuZXRzXHJcbiAgICAvL1xyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdNZWNhdG9sIFJleCcsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogNixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0FieXonLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSEFaQVJET1VTLFxyXG4gICAgICAgIHJlc291cmNlczogMyxcclxuICAgICAgICBpbmZsdWVuY2U6IDAsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdGcmlhJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnQXJpbmFtJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLklORFVTVFJJQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ01lZXInLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSEFaQVJET1VTLFxyXG4gICAgICAgIHJlc291cmNlczogMCxcclxuICAgICAgICBpbmZsdWVuY2U6IDQsXHJcbiAgICAgICAgd2FyZmFyZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0Fybm9yJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLklORFVTVFJJQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0xvcicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5JTkRVU1RSSUFMLFxyXG4gICAgICAgIHJlc291cmNlczogMixcclxuICAgICAgICBpbmZsdWVuY2U6IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdCZXJlZycsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5IQVpBUkRPVVMsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAzLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0xpcnRhIElWJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAzLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnQ2VudGF1cmknLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0dyYWwnLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSU5EVVNUUklBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgICAgIHByb3B1bHNpb246IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdDb29ybmVlcScsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5DVUxUVVJBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAyLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnUmVzY3Vpb24nLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMCxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0RhbCBCb290aGEnLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAwLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1h4ZWhhbicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5DVUxUVVJBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnTGF6YXInLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSU5EVVNUUklBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgICAgIGN5YmVybmV0aWM6IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdTYWt1bGFnJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnTG9kb3InLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAzLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ01laGFyIFh1bGwnLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSEFaQVJET1VTLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDMsXHJcbiAgICAgICAgd2FyZmFyZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ01lbGxvbicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5DVUxUVVJBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDAsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAyLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnWmhvYmF0JyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDMsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnTmV3IEFsYmlvbicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5JTkRVU1RSSUFMLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDEsXHJcbiAgICAgICAgYmlvdGljOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnU3RhcnBvaW50JyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDMsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnUXVhbm4nLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogXCJRdWNlbiduXCIsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5JTkRVU1RSSUFMLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdSYXJyb24nLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuQ1VMVFVSQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAwLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1NhdWRvcicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5JTkRVU1RSSUFMLFxyXG4gICAgICAgIHJlc291cmNlczogMixcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6IFwiVGFyJ01hbm5cIixcclxuICAgICAgICB0cmFpdDogVHJhaXRzLklORFVTVFJJQUwsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAxLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMSxcclxuICAgICAgICBiaW90aWM6IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6IFwiVGVxdSdyYW5cIixcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkhBWkFSRE9VUyxcclxuICAgICAgICByZXNvdXJjZXM6IDIsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAwLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnVG9ya2FuJyxcclxuICAgICAgICB0cmFpdDogVHJhaXRzLkNVTFRVUkFMLFxyXG4gICAgICAgIHJlc291cmNlczogMCxcclxuICAgICAgICBpbmZsdWVuY2U6IDMsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdUaGliYWgnLFxyXG4gICAgICAgIHRyYWl0OiBUcmFpdHMuSU5EVVNUUklBTCxcclxuICAgICAgICByZXNvdXJjZXM6IDEsXHJcbiAgICAgICAgaW5mbHVlbmNlOiAxLFxyXG4gICAgICAgIHByb3B1bHNpb246IDEsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdWZWZ1dCBJSScsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5IQVpBUkRPVVMsXHJcbiAgICAgICAgcmVzb3VyY2VzOiAyLFxyXG4gICAgICAgIGluZmx1ZW5jZTogMixcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1dlbGxvbicsXHJcbiAgICAgICAgdHJhaXQ6IFRyYWl0cy5JTkRVU1RSSUFMLFxyXG4gICAgICAgIHJlc291cmNlczogMSxcclxuICAgICAgICBpbmZsdWVuY2U6IDIsXHJcbiAgICAgICAgY3liZXJuZXRpYzogMSxcclxuICAgIH0sXHJcbl0uc29ydCgoYWEsIGJiKSA9PiB7XHJcbiAgICAvLyBTb3J0IGFscGhhYmV0aWNhbGx5XHJcbiAgICBjb25zdCBhID0gYWEubmFtZS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgY29uc3QgYiA9IGJiLm5hbWUudG9Mb3dlckNhc2UoKTtcclxuICAgIGlmIChhID09PSBiKSB7XHJcbiAgICAgICAgcmV0dXJuIDA7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGEgPCBiID8gLTEgOiAxO1xyXG59KTtcclxuXHJcbmV4cG9ydCBjb25zdCBQbGFuZXRzTWFwOiBSZWFkb25seTxQbGFuZXRNYXA+ID0gUGxhbmV0cy5yZWR1Y2UoKG06IFBsYW5ldE1hcCwgcDogUGxhbmV0KTogUGxhbmV0TWFwID0+IHtcclxuICAgIG1bcC5uYW1lXSA9IHA7XHJcbiAgICByZXR1cm4gbTtcclxufSwge30pO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RQbGFuZXRzKCk6IFJlYWRvbmx5PFBsYW5ldE1hcD4ge1xyXG4gICAgcmV0dXJuIFBsYW5ldHNNYXA7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0aW9uUGxhbmV0cyhuYW1lOiBzdHJpbmcpIHtcclxuICAgIGlmICghbmFtZSkge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gUGxhbmV0cy5maWx0ZXIocCA9PiBwLmhvbWUgPT09IG5hbWUpO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/database/planet.ts\n");

/***/ }),

/***/ "./src/server/database/strategy.ts":
/*!*****************************************!*\
  !*** ./src/server/database/strategy.ts ***!
  \*****************************************/
/*! exports provided: listCards */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"listCards\", function() { return listCards; });\nconst _strategyCards = [\r\n    ,\r\n    {\r\n        name: 'Leadership',\r\n        initiative: 1,\r\n        primary: [\r\n            'Gain 3 command tokens.',\r\n            'Spend any amount of influence to gain 1 command token for every 3 influence spent.',\r\n        ],\r\n        secondary: ['Spend any amount of influence to gain 1 command token for every 3 influence spent.'],\r\n    },\r\n    {\r\n        name: 'Diplomacy',\r\n        initiative: 2,\r\n        primary: [\r\n            'Choose 1 system other than the Mecatol Rex system that contains a planet you control; each other player places a command token from their reinforcements in the chosen system.  Then, ready each exhausted planet you control in that system.',\r\n        ],\r\n        secondary: ['Spend 1 token from your strategy pool to ready up to 2 exhausted planets you control.'],\r\n    },\r\n    {\r\n        name: 'Politics',\r\n        initiative: 3,\r\n        primary: [\r\n            'Choose a player other than the speaker.  That player gains the speaker token.',\r\n            'Draw 2 action cards.',\r\n            'Look at the top 2 cards of the agenda deck.  Place each card on the top or bottom of the deck in any order.',\r\n        ],\r\n        secondary: ['Spend 1 token from your strategy pool to draw 2 action cards.'],\r\n    },\r\n    {\r\n        name: 'Construction',\r\n        initiative: 4,\r\n        primary: ['Place 1 PDS or 1 space dock on a planet you control.', 'Place 1 PDS on a planet you control.'],\r\n        secondary: [\r\n            'Place 1 token from your strategy pool in any system; you may place either 1 space dock or 1 PDS on a planet you control in that system.',\r\n        ],\r\n    },\r\n    {\r\n        name: 'Trade',\r\n        initiative: 5,\r\n        primary: [\r\n            'Gain 3 trade goods.',\r\n            'Replenish commodities.',\r\n            'Choose any number of other players. Those players use the secondary ability of this strategy card without spending a command token.',\r\n        ],\r\n        secondary: ['Spend 1 token from your strategy pool to replenish your commodities.'],\r\n    },\r\n    {\r\n        name: 'Warfare',\r\n        initiative: 6,\r\n        primary: [\r\n            'Remove 1 of your command tokens from the game board; then, gain 1 command token.',\r\n            'Redistribute any number of the command tokens on your command sheet.',\r\n        ],\r\n        secondary: [\r\n            'Spend 1 token from your strategy pool to use the PRODUCTION ability of 1 of your space docks in your home system.',\r\n        ],\r\n    },\r\n    {\r\n        name: 'Technology',\r\n        initiative: 7,\r\n        primary: ['Research 1 technology.', 'Spend 6 resources to research 1 technology.'],\r\n        secondary: ['Spend 1 token from your strategy pool and 4 resources to research 1 technology.'],\r\n    },\r\n    {\r\n        name: 'Imperial',\r\n        initiative: 8,\r\n        primary: [\r\n            'Immediately score 1 public objective if you fulfill its requirements.',\r\n            'Gain 1 victory point if you control Mecatol Rex; otherwise, draw 1 secret objective.',\r\n        ],\r\n        secondary: ['Spend 1 token from your strategy pool to draw 1 secret objective.'],\r\n    },\r\n];\r\nfunction listCards() {\r\n    return _strategyCards;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RhdGFiYXNlL3N0cmF0ZWd5LnRzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3NyYy9zZXJ2ZXIvZGF0YWJhc2Uvc3RyYXRlZ3kudHM/ODg2MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdHJhdGVneUNhcmRzVHlwZSB9IGZyb20gJ2NvbW1vbi9HYW1lJztcclxuXHJcbmNvbnN0IF9zdHJhdGVneUNhcmRzOiBSZWFkb25seTxTdHJhdGVneUNhcmRzVHlwZT4gPSBbXHJcbiAgICAsXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ0xlYWRlcnNoaXAnLFxyXG4gICAgICAgIGluaXRpYXRpdmU6IDEsXHJcbiAgICAgICAgcHJpbWFyeTogW1xyXG4gICAgICAgICAgICAnR2FpbiAzIGNvbW1hbmQgdG9rZW5zLicsXHJcbiAgICAgICAgICAgICdTcGVuZCBhbnkgYW1vdW50IG9mIGluZmx1ZW5jZSB0byBnYWluIDEgY29tbWFuZCB0b2tlbiBmb3IgZXZlcnkgMyBpbmZsdWVuY2Ugc3BlbnQuJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHNlY29uZGFyeTogWydTcGVuZCBhbnkgYW1vdW50IG9mIGluZmx1ZW5jZSB0byBnYWluIDEgY29tbWFuZCB0b2tlbiBmb3IgZXZlcnkgMyBpbmZsdWVuY2Ugc3BlbnQuJ10sXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdEaXBsb21hY3knLFxyXG4gICAgICAgIGluaXRpYXRpdmU6IDIsXHJcbiAgICAgICAgcHJpbWFyeTogW1xyXG4gICAgICAgICAgICAnQ2hvb3NlIDEgc3lzdGVtIG90aGVyIHRoYW4gdGhlIE1lY2F0b2wgUmV4IHN5c3RlbSB0aGF0IGNvbnRhaW5zIGEgcGxhbmV0IHlvdSBjb250cm9sOyBlYWNoIG90aGVyIHBsYXllciBwbGFjZXMgYSBjb21tYW5kIHRva2VuIGZyb20gdGhlaXIgcmVpbmZvcmNlbWVudHMgaW4gdGhlIGNob3NlbiBzeXN0ZW0uICBUaGVuLCByZWFkeSBlYWNoIGV4aGF1c3RlZCBwbGFuZXQgeW91IGNvbnRyb2wgaW4gdGhhdCBzeXN0ZW0uJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHNlY29uZGFyeTogWydTcGVuZCAxIHRva2VuIGZyb20geW91ciBzdHJhdGVneSBwb29sIHRvIHJlYWR5IHVwIHRvIDIgZXhoYXVzdGVkIHBsYW5ldHMgeW91IGNvbnRyb2wuJ10sXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICAgIG5hbWU6ICdQb2xpdGljcycsXHJcbiAgICAgICAgaW5pdGlhdGl2ZTogMyxcclxuICAgICAgICBwcmltYXJ5OiBbXHJcbiAgICAgICAgICAgICdDaG9vc2UgYSBwbGF5ZXIgb3RoZXIgdGhhbiB0aGUgc3BlYWtlci4gIFRoYXQgcGxheWVyIGdhaW5zIHRoZSBzcGVha2VyIHRva2VuLicsXHJcbiAgICAgICAgICAgICdEcmF3IDIgYWN0aW9uIGNhcmRzLicsXHJcbiAgICAgICAgICAgICdMb29rIGF0IHRoZSB0b3AgMiBjYXJkcyBvZiB0aGUgYWdlbmRhIGRlY2suICBQbGFjZSBlYWNoIGNhcmQgb24gdGhlIHRvcCBvciBib3R0b20gb2YgdGhlIGRlY2sgaW4gYW55IG9yZGVyLicsXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzZWNvbmRhcnk6IFsnU3BlbmQgMSB0b2tlbiBmcm9tIHlvdXIgc3RyYXRlZ3kgcG9vbCB0byBkcmF3IDIgYWN0aW9uIGNhcmRzLiddLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnQ29uc3RydWN0aW9uJyxcclxuICAgICAgICBpbml0aWF0aXZlOiA0LFxyXG4gICAgICAgIHByaW1hcnk6IFsnUGxhY2UgMSBQRFMgb3IgMSBzcGFjZSBkb2NrIG9uIGEgcGxhbmV0IHlvdSBjb250cm9sLicsICdQbGFjZSAxIFBEUyBvbiBhIHBsYW5ldCB5b3UgY29udHJvbC4nXSxcclxuICAgICAgICBzZWNvbmRhcnk6IFtcclxuICAgICAgICAgICAgJ1BsYWNlIDEgdG9rZW4gZnJvbSB5b3VyIHN0cmF0ZWd5IHBvb2wgaW4gYW55IHN5c3RlbTsgeW91IG1heSBwbGFjZSBlaXRoZXIgMSBzcGFjZSBkb2NrIG9yIDEgUERTIG9uIGEgcGxhbmV0IHlvdSBjb250cm9sIGluIHRoYXQgc3lzdGVtLicsXHJcbiAgICAgICAgXSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RyYWRlJyxcclxuICAgICAgICBpbml0aWF0aXZlOiA1LFxyXG4gICAgICAgIHByaW1hcnk6IFtcclxuICAgICAgICAgICAgJ0dhaW4gMyB0cmFkZSBnb29kcy4nLFxyXG4gICAgICAgICAgICAnUmVwbGVuaXNoIGNvbW1vZGl0aWVzLicsXHJcbiAgICAgICAgICAgICdDaG9vc2UgYW55IG51bWJlciBvZiBvdGhlciBwbGF5ZXJzLiBUaG9zZSBwbGF5ZXJzIHVzZSB0aGUgc2Vjb25kYXJ5IGFiaWxpdHkgb2YgdGhpcyBzdHJhdGVneSBjYXJkIHdpdGhvdXQgc3BlbmRpbmcgYSBjb21tYW5kIHRva2VuLicsXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzZWNvbmRhcnk6IFsnU3BlbmQgMSB0b2tlbiBmcm9tIHlvdXIgc3RyYXRlZ3kgcG9vbCB0byByZXBsZW5pc2ggeW91ciBjb21tb2RpdGllcy4nXSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1dhcmZhcmUnLFxyXG4gICAgICAgIGluaXRpYXRpdmU6IDYsXHJcbiAgICAgICAgcHJpbWFyeTogW1xyXG4gICAgICAgICAgICAnUmVtb3ZlIDEgb2YgeW91ciBjb21tYW5kIHRva2VucyBmcm9tIHRoZSBnYW1lIGJvYXJkOyB0aGVuLCBnYWluIDEgY29tbWFuZCB0b2tlbi4nLFxyXG4gICAgICAgICAgICAnUmVkaXN0cmlidXRlIGFueSBudW1iZXIgb2YgdGhlIGNvbW1hbmQgdG9rZW5zIG9uIHlvdXIgY29tbWFuZCBzaGVldC4nLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc2Vjb25kYXJ5OiBbXHJcbiAgICAgICAgICAgICdTcGVuZCAxIHRva2VuIGZyb20geW91ciBzdHJhdGVneSBwb29sIHRvIHVzZSB0aGUgUFJPRFVDVElPTiBhYmlsaXR5IG9mIDEgb2YgeW91ciBzcGFjZSBkb2NrcyBpbiB5b3VyIGhvbWUgc3lzdGVtLicsXHJcbiAgICAgICAgXSxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgICAgbmFtZTogJ1RlY2hub2xvZ3knLFxyXG4gICAgICAgIGluaXRpYXRpdmU6IDcsXHJcbiAgICAgICAgcHJpbWFyeTogWydSZXNlYXJjaCAxIHRlY2hub2xvZ3kuJywgJ1NwZW5kIDYgcmVzb3VyY2VzIHRvIHJlc2VhcmNoIDEgdGVjaG5vbG9neS4nXSxcclxuICAgICAgICBzZWNvbmRhcnk6IFsnU3BlbmQgMSB0b2tlbiBmcm9tIHlvdXIgc3RyYXRlZ3kgcG9vbCBhbmQgNCByZXNvdXJjZXMgdG8gcmVzZWFyY2ggMSB0ZWNobm9sb2d5LiddLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgICBuYW1lOiAnSW1wZXJpYWwnLFxyXG4gICAgICAgIGluaXRpYXRpdmU6IDgsXHJcbiAgICAgICAgcHJpbWFyeTogW1xyXG4gICAgICAgICAgICAnSW1tZWRpYXRlbHkgc2NvcmUgMSBwdWJsaWMgb2JqZWN0aXZlIGlmIHlvdSBmdWxmaWxsIGl0cyByZXF1aXJlbWVudHMuJyxcclxuICAgICAgICAgICAgJ0dhaW4gMSB2aWN0b3J5IHBvaW50IGlmIHlvdSBjb250cm9sIE1lY2F0b2wgUmV4OyBvdGhlcndpc2UsIGRyYXcgMSBzZWNyZXQgb2JqZWN0aXZlLicsXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzZWNvbmRhcnk6IFsnU3BlbmQgMSB0b2tlbiBmcm9tIHlvdXIgc3RyYXRlZ3kgcG9vbCB0byBkcmF3IDEgc2VjcmV0IG9iamVjdGl2ZS4nXSxcclxuICAgIH0sXHJcbl07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbGlzdENhcmRzKCkge1xyXG4gICAgcmV0dXJuIF9zdHJhdGVneUNhcmRzO1xyXG59XHJcbiJdLCJtYXBwaW5ncyI6IkFBRUE7QUFBQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/database/strategy.ts\n");

/***/ }),

/***/ "./src/server/dirty.ts":
/*!*****************************!*\
  !*** ./src/server/dirty.ts ***!
  \*****************************/
/*! exports provided: dirty, setDirty, isDirty, markGameDirty, getDirtyGameData */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"dirty\", function() { return dirty; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"setDirty\", function() { return setDirty; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"isDirty\", function() { return isDirty; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"markGameDirty\", function() { return markGameDirty; });\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"getDirtyGameData\", function() { return getDirtyGameData; });\n/* harmony import */ var lodash_isEmpty__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash/isEmpty */ \"lodash/isEmpty\");\n/* harmony import */ var lodash_isEmpty__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash_isEmpty__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var _database_game__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./database/game */ \"./src/server/database/game.ts\");\n\r\n\r\n// Keep track what data needs to be broadcasted to everyone.\r\nconst dirty = {\r\n    games: {},\r\n    planets: false,\r\n    accounts: false,\r\n};\r\nfunction setDirty(value = true) {\r\n    dirty.planets = value;\r\n    dirty.accounts = value;\r\n    dirty.games = {};\r\n    if (value) {\r\n        const allGames = _database_game__WEBPACK_IMPORTED_MODULE_1__[\"listGames\"]();\r\n        Object.keys(allGames).forEach(gameId => markGameDirty(gameId));\r\n    }\r\n}\r\nfunction isDirty() {\r\n    if (dirty.planets || dirty.accounts) {\r\n        return true;\r\n    }\r\n    return !lodash_isEmpty__WEBPACK_IMPORTED_MODULE_0___default()(dirty.games);\r\n}\r\n// Helper to mark parts of a Game object to be broadcasted out.\r\nfunction markGameDirty(gameId, dirtyParts = { created: false, deleted: false, status: true, planets: true, players: true }) {\r\n    const data = dirty.games[gameId];\r\n    dirty.games[gameId] = Object.assign(Object.assign({}, data), dirtyParts);\r\n}\r\nfunction getDirtyGameData() {\r\n    const gameDataMap = {};\r\n    const dirtyArray = Object.entries(dirty.games);\r\n    dirtyArray.forEach(([gameId, dirtyParts]) => {\r\n        // Build data for each dirty game\r\n        const gameData = { id: gameId };\r\n        const { created, deleted, status, planets, players } = dirtyParts;\r\n        if (deleted) {\r\n            gameData.deleted = true;\r\n            gameDataMap[gameId] = gameData;\r\n            return;\r\n        }\r\n        const game = _database_game__WEBPACK_IMPORTED_MODULE_1__[\"getGame\"](gameId);\r\n        if (!game) {\r\n            return;\r\n        }\r\n        if (created) {\r\n            // Send back full game info\r\n            gameData.created = game;\r\n            gameDataMap[gameId] = gameData;\r\n        }\r\n        // Send only the part that has changed\r\n        if (status) {\r\n            gameData.status = game.status;\r\n        }\r\n        if (planets) {\r\n            gameData.planets = game.planets;\r\n        }\r\n        if (players) {\r\n            gameData.players = game.players;\r\n        }\r\n        gameDataMap[gameId] = gameData;\r\n    });\r\n    return dirtyArray.length ? gameDataMap : null;\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2RpcnR5LnRzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3NyYy9zZXJ2ZXIvZGlydHkudHM/NzA0YSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgaXNFbXB0eSBmcm9tICdsb2Rhc2gvaXNFbXB0eSc7XHJcblxyXG5pbXBvcnQgeyBHYW1lQ2hhbmdlRGF0YU1hcCwgR2FtZUNoYW5nZURhdGEgfSBmcm9tICdjb21tb24vR2FtZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBHYW1lREIgZnJvbSAnLi9kYXRhYmFzZS9nYW1lJztcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgRGlydHlHYW1lUGFydHMge1xyXG4gICAgY3JlYXRlZD86IGJvb2xlYW47XHJcbiAgICBkZWxldGVkPzogYm9vbGVhbjtcclxuICAgIHN0YXR1cz86IGJvb2xlYW47XHJcbiAgICBwbGFuZXRzPzogYm9vbGVhbjtcclxuICAgIHBsYXllcnM/OiBib29sZWFuO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIERpcnR5R2FtZVBhcnRzTWFwIHtcclxuICAgIFtpZDogc3RyaW5nXTogRGlydHlHYW1lUGFydHM7XHJcbn1cclxuXHJcbi8vIEtlZXAgdHJhY2sgd2hhdCBkYXRhIG5lZWRzIHRvIGJlIGJyb2FkY2FzdGVkIHRvIGV2ZXJ5b25lLlxyXG5leHBvcnQgY29uc3QgZGlydHkgPSB7XHJcbiAgICBnYW1lczoge30gYXMgRGlydHlHYW1lUGFydHNNYXAsXHJcbiAgICBwbGFuZXRzOiBmYWxzZSxcclxuICAgIGFjY291bnRzOiBmYWxzZSxcclxufTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXREaXJ0eSh2YWx1ZTogYm9vbGVhbiA9IHRydWUpIHtcclxuICAgIGRpcnR5LnBsYW5ldHMgPSB2YWx1ZTtcclxuICAgIGRpcnR5LmFjY291bnRzID0gdmFsdWU7XHJcbiAgICBkaXJ0eS5nYW1lcyA9IHt9O1xyXG5cclxuICAgIGlmICh2YWx1ZSkge1xyXG4gICAgICAgIGNvbnN0IGFsbEdhbWVzID0gR2FtZURCLmxpc3RHYW1lcygpO1xyXG4gICAgICAgIE9iamVjdC5rZXlzKGFsbEdhbWVzKS5mb3JFYWNoKGdhbWVJZCA9PiBtYXJrR2FtZURpcnR5KGdhbWVJZCkpO1xyXG4gICAgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gaXNEaXJ0eSgpOiBib29sZWFuIHtcclxuICAgIGlmIChkaXJ0eS5wbGFuZXRzIHx8IGRpcnR5LmFjY291bnRzKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuICFpc0VtcHR5KGRpcnR5LmdhbWVzKTtcclxufVxyXG5cclxuLy8gSGVscGVyIHRvIG1hcmsgcGFydHMgb2YgYSBHYW1lIG9iamVjdCB0byBiZSBicm9hZGNhc3RlZCBvdXQuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYXJrR2FtZURpcnR5KFxyXG4gICAgZ2FtZUlkOiBzdHJpbmcsXHJcbiAgICBkaXJ0eVBhcnRzOiBEaXJ0eUdhbWVQYXJ0cyA9IHsgY3JlYXRlZDogZmFsc2UsIGRlbGV0ZWQ6IGZhbHNlLCBzdGF0dXM6IHRydWUsIHBsYW5ldHM6IHRydWUsIHBsYXllcnM6IHRydWUgfSxcclxuKSB7XHJcbiAgICBjb25zdCBkYXRhID0gZGlydHkuZ2FtZXNbZ2FtZUlkXTtcclxuICAgIGRpcnR5LmdhbWVzW2dhbWVJZF0gPSB7IC4uLmRhdGEsIC4uLmRpcnR5UGFydHMgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldERpcnR5R2FtZURhdGEoKTogR2FtZUNoYW5nZURhdGFNYXAgfCBudWxsIHtcclxuICAgIGNvbnN0IGdhbWVEYXRhTWFwOiBHYW1lQ2hhbmdlRGF0YU1hcCA9IHt9O1xyXG4gICAgY29uc3QgZGlydHlBcnJheSA9IE9iamVjdC5lbnRyaWVzKGRpcnR5LmdhbWVzKTtcclxuICAgIGRpcnR5QXJyYXkuZm9yRWFjaCgoW2dhbWVJZCwgZGlydHlQYXJ0c10pID0+IHtcclxuICAgICAgICAvLyBCdWlsZCBkYXRhIGZvciBlYWNoIGRpcnR5IGdhbWVcclxuICAgICAgICBjb25zdCBnYW1lRGF0YTogR2FtZUNoYW5nZURhdGEgPSB7IGlkOiBnYW1lSWQgfTtcclxuICAgICAgICBjb25zdCB7IGNyZWF0ZWQsIGRlbGV0ZWQsIHN0YXR1cywgcGxhbmV0cywgcGxheWVycyB9ID0gZGlydHlQYXJ0cztcclxuICAgICAgICBpZiAoZGVsZXRlZCkge1xyXG4gICAgICAgICAgICBnYW1lRGF0YS5kZWxldGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgZ2FtZURhdGFNYXBbZ2FtZUlkXSA9IGdhbWVEYXRhO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBnYW1lID0gR2FtZURCLmdldEdhbWUoZ2FtZUlkKTtcclxuICAgICAgICBpZiAoIWdhbWUpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNyZWF0ZWQpIHtcclxuICAgICAgICAgICAgLy8gU2VuZCBiYWNrIGZ1bGwgZ2FtZSBpbmZvXHJcbiAgICAgICAgICAgIGdhbWVEYXRhLmNyZWF0ZWQgPSBnYW1lO1xyXG4gICAgICAgICAgICBnYW1lRGF0YU1hcFtnYW1lSWRdID0gZ2FtZURhdGE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTZW5kIG9ubHkgdGhlIHBhcnQgdGhhdCBoYXMgY2hhbmdlZFxyXG4gICAgICAgIGlmIChzdGF0dXMpIHtcclxuICAgICAgICAgICAgZ2FtZURhdGEuc3RhdHVzID0gZ2FtZS5zdGF0dXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGxhbmV0cykge1xyXG4gICAgICAgICAgICBnYW1lRGF0YS5wbGFuZXRzID0gZ2FtZS5wbGFuZXRzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBsYXllcnMpIHtcclxuICAgICAgICAgICAgZ2FtZURhdGEucGxheWVycyA9IGdhbWUucGxheWVycztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdhbWVEYXRhTWFwW2dhbWVJZF0gPSBnYW1lRGF0YTtcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBkaXJ0eUFycmF5Lmxlbmd0aCA/IGdhbWVEYXRhTWFwIDogbnVsbDtcclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBSUE7QUFjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBSUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBRUE7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/server/dirty.ts\n");

/***/ }),

/***/ "./src/server/handleMessage.ts":
/*!*************************************!*\
  !*** ./src/server/handleMessage.ts ***!
  \*************************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return handleMessage; });\n/* harmony import */ var lodash_isNil__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash/isNil */ \"lodash/isNil\");\n/* harmony import */ var lodash_isNil__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash_isNil__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var common_error__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! common/error */ \"./src/common/error.ts\");\n/* harmony import */ var common_Game__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! common/Game */ \"./src/common/Game.ts\");\n/* harmony import */ var common_message__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! common/message */ \"./src/common/message.ts\");\n/* harmony import */ var _database_account__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./database/account */ \"./src/server/database/account.ts\");\n/* harmony import */ var _database_faction__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./database/faction */ \"./src/server/database/faction.ts\");\n/* harmony import */ var _database_game__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./database/game */ \"./src/server/database/game.ts\");\n/* harmony import */ var _database_planet__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./database/planet */ \"./src/server/database/planet.ts\");\n/* harmony import */ var _dirty__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./dirty */ \"./src/server/dirty.ts\");\n/* harmony import */ var _log__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./log */ \"./src/server/log.ts\");\n/* harmony import */ var _WebSocket__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./WebSocket */ \"./src/server/WebSocket.ts\");\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n// TODO: Organize better.\r\n// Handle all messages to the WebSocket server.\r\nfunction handleMessage({ wss, ws, message }) {\r\n    if (!message) {\r\n        return;\r\n    }\r\n    const parsedMessage = JSON.parse(message);\r\n    Object(_log__WEBPACK_IMPORTED_MODULE_9__[\"default\"])('Receiving:', parsedMessage);\r\n    const { type = null, data = null } = message ? JSON.parse(message) : {};\r\n    const { accountId = null, gameId = null, playerId = null } = data || {};\r\n    // Handle list actions immediately\r\n    switch (type) {\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].LIST_GAMES:\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type, data: _database_game__WEBPACK_IMPORTED_MODULE_6__[\"listGames\"]() });\r\n            return;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].LIST_PLANETS:\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type, data: _database_planet__WEBPACK_IMPORTED_MODULE_7__[\"listPlanets\"]() });\r\n            return;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].LIST_ACCOUNTS:\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type, data: _database_account__WEBPACK_IMPORTED_MODULE_4__[\"listAccounts\"]() });\r\n            return;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].FACTION_GET: {\r\n            const factionInfo = _database_faction__WEBPACK_IMPORTED_MODULE_5__[\"getFaction\"](data.factionName);\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({\r\n                ws,\r\n                type,\r\n                data: factionInfo,\r\n                error: factionInfo ? null : `Unable to find faction: \"${data.factionName}\"`,\r\n            });\r\n            return;\r\n        }\r\n        default:\r\n            break;\r\n    }\r\n    // Player account actions\r\n    switch (type) {\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_ADD:\r\n            _database_account__WEBPACK_IMPORTED_MODULE_4__[\"addAccount\"](accountId);\r\n            _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_DELETE:\r\n            _database_account__WEBPACK_IMPORTED_MODULE_4__[\"deleteAccount\"](accountId);\r\n            _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_LOGIN:\r\n            _database_account__WEBPACK_IMPORTED_MODULE_4__[\"login\"](accountId);\r\n            ws.accountId = accountId;\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type: common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_LOGIN, data: accountId });\r\n            _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_LOGOUT:\r\n            const account = _database_account__WEBPACK_IMPORTED_MODULE_4__[\"getAccount\"](accountId);\r\n            if (account && account.joinedGame) {\r\n                const game = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getGame\"](account.joinedGame);\r\n                if (game) {\r\n                    game.players[accountId].joined = false;\r\n                    Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(game.id, { players: true });\r\n                }\r\n            }\r\n            ws.accountId = null;\r\n            _database_account__WEBPACK_IMPORTED_MODULE_4__[\"logout\"](accountId);\r\n            Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type: common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].ACCOUNT_LOGOUT, data: accountId });\r\n            _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n            break;\r\n        default:\r\n            break;\r\n    }\r\n    switch (type) {\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].CREATE_GAME: {\r\n            const { version, name } = data || {};\r\n            if (playerId) {\r\n                const game = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"createGame\"]({ creator: playerId, version, name });\r\n                Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(game.id, { created: true });\r\n            }\r\n            break;\r\n        }\r\n        default:\r\n            break;\r\n    }\r\n    // Following actions require a game\r\n    const game = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getGame\"](gameId);\r\n    if (!game) {\r\n        return;\r\n    }\r\n    switch (type) {\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].DELETE_GAME: {\r\n            if (game.creator === playerId) {\r\n                // Remove every player account from the game\r\n                Object.values(game.players).forEach(p => {\r\n                    const account = _database_account__WEBPACK_IMPORTED_MODULE_4__[\"getAccount\"](p.id);\r\n                    if (account) {\r\n                        account.joinedGame = null;\r\n                    }\r\n                });\r\n                _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n                // Delete game\r\n                _database_game__WEBPACK_IMPORTED_MODULE_6__[\"deleteGame\"](gameId);\r\n                Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { deleted: true });\r\n            }\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].START_GAME:\r\n            // Initialize players with their home planets.\r\n            Object.values(game.players).forEach(player => {\r\n                if (player.faction) {\r\n                    const factionPlanets = _database_planet__WEBPACK_IMPORTED_MODULE_7__[\"getFactionPlanets\"](player.faction);\r\n                    player.planets = factionPlanets.map(p => p.name);\r\n                    factionPlanets.forEach(p => (game.planets[p.name].owner = player.id));\r\n                }\r\n            });\r\n            game.status.started = true;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId);\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].STOP_GAME:\r\n            game.status.started = false;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { status: true });\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_JOIN_GAME: {\r\n            const { players, status } = game;\r\n            if (!status.started || (status.started && players[playerId])) {\r\n                // Add player to the game\r\n                _database_game__WEBPACK_IMPORTED_MODULE_6__[\"addPlayer\"](gameId, playerId);\r\n                Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n                const account = _database_account__WEBPACK_IMPORTED_MODULE_4__[\"getAccount\"](playerId);\r\n                if (account) {\r\n                    account.joinedGame = gameId;\r\n                    _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n                }\r\n            }\r\n            else {\r\n                Object(_WebSocket__WEBPACK_IMPORTED_MODULE_10__[\"sendData\"])({ ws, type: common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_JOIN_GAME, error: common_error__WEBPACK_IMPORTED_MODULE_1__[\"ErrorType\"].GAME_UNABLE_TO_JOIN });\r\n                return;\r\n            }\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_LEAVE_GAME: {\r\n            // Remove player from the game\r\n            _database_game__WEBPACK_IMPORTED_MODULE_6__[\"removePlayer\"](gameId, playerId, Boolean(data.deletePlayer));\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            const player = _database_account__WEBPACK_IMPORTED_MODULE_4__[\"getAccount\"](playerId);\r\n            if (player) {\r\n                player.joinedGame = null;\r\n                _dirty__WEBPACK_IMPORTED_MODULE_8__[\"dirty\"].accounts = true;\r\n            }\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].GAME_STATUS_SET: {\r\n            const { round, phase, turn, speaker, pickOrder, pickTurn } = data;\r\n            const { status } = game;\r\n            if (round > status.round) {\r\n                Object.values(game.players).forEach(p => {\r\n                    p.strategyCard = common_Game__WEBPACK_IMPORTED_MODULE_2__[\"StrategyCardIndex\"].NONE;\r\n                    p.strategyCardTaken = false;\r\n                    p.stragetyCardUsed = false;\r\n                });\r\n                Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            }\r\n            status.round = round || status.round;\r\n            status.phase = !lodash_isNil__WEBPACK_IMPORTED_MODULE_0___default()(phase) ? phase : status.phase;\r\n            status.turn = turn || status.turn;\r\n            status.speaker = speaker || status.speaker;\r\n            status.pickOrder = pickOrder || status.pickOrder;\r\n            status.pickTurn = !lodash_isNil__WEBPACK_IMPORTED_MODULE_0___default()(pickTurn) ? pickTurn : status.pickTurn;\r\n            if (status.pickTurn > status.pickOrder.length - 1) {\r\n                status.pickTurn = 0;\r\n            }\r\n            if (status.pickOrder[0] !== status.speaker) {\r\n                const speakerIndex = status.pickOrder.indexOf(status.speaker);\r\n                const preSpeaker = status.pickOrder.slice(0, speakerIndex);\r\n                const postSpeaker = status.pickOrder.slice(speakerIndex);\r\n                status.pickOrder = [...postSpeaker, ...preSpeaker];\r\n            }\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { status: true });\r\n            break;\r\n        }\r\n        default:\r\n            break;\r\n    }\r\n    // Following actions require a player\r\n    const players = game.players;\r\n    const player = players && players[playerId];\r\n    if (!player) {\r\n        return;\r\n    }\r\n    switch (type) {\r\n        // Player Setup actions\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_SET_COLOR:\r\n            player.color = data.color;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_SET_FACTION:\r\n            player.faction = data.factionName;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            break;\r\n        // Strategy Card actions\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_TAKE_STRATEGY_CARD: {\r\n            const owner = Object.values(players).find(p => p.strategyCard === data.strategyCard);\r\n            if (owner && owner !== playerId) {\r\n                return;\r\n            }\r\n            const { status } = game;\r\n            const { pickTurn, pickOrder } = status;\r\n            player.strategyCard = data.strategyCard;\r\n            if (!player.strategyCardTaken) {\r\n                player.strategyCardTaken = true;\r\n                status.pickTurn = pickTurn === pickOrder.length - 1 ? 0 : pickTurn + 1;\r\n            }\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true, status: true });\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_USE_STRATEGY_CARD:\r\n            player.stragetyCardUsed = true;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            break;\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_RETURN_STRATEGY_CARD:\r\n            player.strategyCard = common_Game__WEBPACK_IMPORTED_MODULE_2__[\"StrategyCardIndex\"].NONE;\r\n            player.stragetyCardUsed = false;\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { players: true });\r\n            break;\r\n        // Planet actions\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_TAKE_PLANET: {\r\n            const { planetId } = data || {};\r\n            const planets = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getPlanetsArray\"](gameId, planetId);\r\n            planets.forEach(p => {\r\n                const prevOwner = p.owner;\r\n                p.owner = playerId;\r\n                p.refreshed = false;\r\n                player.planets.push(p.name);\r\n                const previousPlayer = prevOwner && players[prevOwner];\r\n                if (previousPlayer) {\r\n                    previousPlayer.planets = previousPlayer.planets.filter(pp => pp !== p.name);\r\n                }\r\n            });\r\n            player.planets.sort();\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { planets: true, players: true });\r\n            // TODO: Send notifications to previous owners.\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_LOST_PLANET: {\r\n            const { planetId } = data || {};\r\n            const planets = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getPlanetsArray\"](gameId, planetId);\r\n            planets.forEach(p => {\r\n                if (p.owner === playerId) {\r\n                    p.owner = null;\r\n                }\r\n            });\r\n            const planetIdArray = Array.isArray(planetId) ? planetId : [planetId];\r\n            player.planets = player.planets.filter(p => !planetIdArray.includes(p)).sort();\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { planets: true, players: true });\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_EXHAUST_PLANET: {\r\n            const { planetId } = data || {};\r\n            const planets = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getPlanetsArray\"](gameId, planetId).filter(p => p.owner === playerId);\r\n            planets.forEach(p => (p.refreshed = false));\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { planets: true });\r\n            break;\r\n        }\r\n        case common_message__WEBPACK_IMPORTED_MODULE_3__[\"MessageType\"].PLAYER_REFRESH_PLANET: {\r\n            const { planetId } = data || {};\r\n            const planets = _database_game__WEBPACK_IMPORTED_MODULE_6__[\"getPlanetsArray\"](gameId, planetId).filter(p => p.owner === playerId);\r\n            planets.forEach(p => (p.refreshed = true));\r\n            Object(_dirty__WEBPACK_IMPORTED_MODULE_8__[\"markGameDirty\"])(gameId, { planets: true });\r\n            break;\r\n        }\r\n        default:\r\n            break;\r\n    }\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2hhbmRsZU1lc3NhZ2UudHMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vc3JjL3NlcnZlci9oYW5kbGVNZXNzYWdlLnRzPzA2MmQiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGlzTmlsIGZyb20gJ2xvZGFzaC9pc05pbCc7XHJcblxyXG5pbXBvcnQgeyBFcnJvclR5cGUgfSBmcm9tICdjb21tb24vZXJyb3InO1xyXG5pbXBvcnQgeyBTdHJhdGVneUNhcmRJbmRleCB9IGZyb20gJ2NvbW1vbi9HYW1lJztcclxuaW1wb3J0IHsgTWVzc2FnZVR5cGUgfSBmcm9tICdjb21tb24vbWVzc2FnZSc7XHJcblxyXG5pbXBvcnQgKiBhcyBBY2NvdW50REIgZnJvbSAnLi9kYXRhYmFzZS9hY2NvdW50JztcclxuaW1wb3J0ICogYXMgRmFjdGlvbkRCIGZyb20gJy4vZGF0YWJhc2UvZmFjdGlvbic7XHJcbmltcG9ydCAqIGFzIEdhbWVEQiBmcm9tICcuL2RhdGFiYXNlL2dhbWUnO1xyXG5pbXBvcnQgKiBhcyBQbGFuZXREQiBmcm9tICcuL2RhdGFiYXNlL3BsYW5ldCc7XHJcblxyXG5pbXBvcnQgeyBkaXJ0eSwgbWFya0dhbWVEaXJ0eSB9IGZyb20gJy4vZGlydHknO1xyXG5pbXBvcnQgbG9nIGZyb20gJy4vbG9nJztcclxuaW1wb3J0IHsgc2VuZERhdGEsIFdlYlNvY2tldFNlcnZlciwgV2ViU29ja2V0IH0gZnJvbSAnLi9XZWJTb2NrZXQnO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBoYW5kbGVNZXNzYWdlUGFyYW1zIHtcclxuICAgIHdzczogV2ViU29ja2V0U2VydmVyO1xyXG4gICAgd3M6IFdlYlNvY2tldDtcclxuICAgIG1lc3NhZ2U6IHN0cmluZztcclxufVxyXG5cclxuLy8gVE9ETzogT3JnYW5pemUgYmV0dGVyLlxyXG4vLyBIYW5kbGUgYWxsIG1lc3NhZ2VzIHRvIHRoZSBXZWJTb2NrZXQgc2VydmVyLlxyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKHsgd3NzLCB3cywgbWVzc2FnZSB9OiBoYW5kbGVNZXNzYWdlUGFyYW1zKSB7XHJcbiAgICBpZiAoIW1lc3NhZ2UpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFyc2VkTWVzc2FnZSA9IEpTT04ucGFyc2UobWVzc2FnZSk7XHJcbiAgICBsb2coJ1JlY2VpdmluZzonLCBwYXJzZWRNZXNzYWdlKTtcclxuXHJcbiAgICBjb25zdCB7IHR5cGUgPSBudWxsLCBkYXRhID0gbnVsbCB9ID0gbWVzc2FnZSA/IEpTT04ucGFyc2UobWVzc2FnZSkgOiB7fTtcclxuICAgIGNvbnN0IHsgYWNjb3VudElkID0gbnVsbCwgZ2FtZUlkID0gbnVsbCwgcGxheWVySWQgPSBudWxsIH0gPSBkYXRhIHx8IHt9O1xyXG5cclxuICAgIC8vIEhhbmRsZSBsaXN0IGFjdGlvbnMgaW1tZWRpYXRlbHlcclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuTElTVF9HQU1FUzpcclxuICAgICAgICAgICAgc2VuZERhdGEoeyB3cywgdHlwZSwgZGF0YTogR2FtZURCLmxpc3RHYW1lcygpIH0pO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5MSVNUX1BMQU5FVFM6XHJcbiAgICAgICAgICAgIHNlbmREYXRhKHsgd3MsIHR5cGUsIGRhdGE6IFBsYW5ldERCLmxpc3RQbGFuZXRzKCkgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkxJU1RfQUNDT1VOVFM6XHJcbiAgICAgICAgICAgIHNlbmREYXRhKHsgd3MsIHR5cGUsIGRhdGE6IEFjY291bnREQi5saXN0QWNjb3VudHMoKSB9KTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuRkFDVElPTl9HRVQ6IHtcclxuICAgICAgICAgICAgY29uc3QgZmFjdGlvbkluZm8gPSBGYWN0aW9uREIuZ2V0RmFjdGlvbihkYXRhLmZhY3Rpb25OYW1lKTtcclxuICAgICAgICAgICAgc2VuZERhdGEoe1xyXG4gICAgICAgICAgICAgICAgd3MsXHJcbiAgICAgICAgICAgICAgICB0eXBlLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZmFjdGlvbkluZm8sXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogZmFjdGlvbkluZm8gPyBudWxsIDogYFVuYWJsZSB0byBmaW5kIGZhY3Rpb246IFwiJHtkYXRhLmZhY3Rpb25OYW1lfVwiYCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUGxheWVyIGFjY291bnQgYWN0aW9uc1xyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5BQ0NPVU5UX0FERDpcclxuICAgICAgICAgICAgQWNjb3VudERCLmFkZEFjY291bnQoYWNjb3VudElkKTtcclxuICAgICAgICAgICAgZGlydHkuYWNjb3VudHMgPSB0cnVlO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkFDQ09VTlRfREVMRVRFOlxyXG4gICAgICAgICAgICBBY2NvdW50REIuZGVsZXRlQWNjb3VudChhY2NvdW50SWQpO1xyXG4gICAgICAgICAgICBkaXJ0eS5hY2NvdW50cyA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQUNDT1VOVF9MT0dJTjpcclxuICAgICAgICAgICAgQWNjb3VudERCLmxvZ2luKGFjY291bnRJZCk7XHJcbiAgICAgICAgICAgIHdzLmFjY291bnRJZCA9IGFjY291bnRJZDtcclxuICAgICAgICAgICAgc2VuZERhdGEoeyB3cywgdHlwZTogTWVzc2FnZVR5cGUuQUNDT1VOVF9MT0dJTiwgZGF0YTogYWNjb3VudElkIH0pO1xyXG4gICAgICAgICAgICBkaXJ0eS5hY2NvdW50cyA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQUNDT1VOVF9MT0dPVVQ6XHJcbiAgICAgICAgICAgIGNvbnN0IGFjY291bnQgPSBBY2NvdW50REIuZ2V0QWNjb3VudChhY2NvdW50SWQpO1xyXG4gICAgICAgICAgICBpZiAoYWNjb3VudCAmJiBhY2NvdW50LmpvaW5lZEdhbWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdhbWUgPSBHYW1lREIuZ2V0R2FtZShhY2NvdW50LmpvaW5lZEdhbWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGdhbWUpIHtcclxuICAgICAgICAgICAgICAgICAgICBnYW1lLnBsYXllcnNbYWNjb3VudElkXS5qb2luZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWUuaWQsIHsgcGxheWVyczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgd3MuYWNjb3VudElkID0gbnVsbDtcclxuICAgICAgICAgICAgQWNjb3VudERCLmxvZ291dChhY2NvdW50SWQpO1xyXG4gICAgICAgICAgICBzZW5kRGF0YSh7IHdzLCB0eXBlOiBNZXNzYWdlVHlwZS5BQ0NPVU5UX0xPR09VVCwgZGF0YTogYWNjb3VudElkIH0pO1xyXG4gICAgICAgICAgICBkaXJ0eS5hY2NvdW50cyA9IHRydWU7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuQ1JFQVRFX0dBTUU6IHtcclxuICAgICAgICAgICAgY29uc3QgeyB2ZXJzaW9uLCBuYW1lIH0gPSBkYXRhIHx8IHt9O1xyXG4gICAgICAgICAgICBpZiAocGxheWVySWQpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGdhbWUgPSBHYW1lREIuY3JlYXRlR2FtZSh7IGNyZWF0b3I6IHBsYXllcklkLCB2ZXJzaW9uLCBuYW1lIH0pO1xyXG4gICAgICAgICAgICAgICAgbWFya0dhbWVEaXJ0eShnYW1lLmlkLCB7IGNyZWF0ZWQ6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZvbGxvd2luZyBhY3Rpb25zIHJlcXVpcmUgYSBnYW1lXHJcbiAgICBjb25zdCBnYW1lID0gR2FtZURCLmdldEdhbWUoZ2FtZUlkKTtcclxuICAgIGlmICghZ2FtZSkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2ggKHR5cGUpIHtcclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLkRFTEVURV9HQU1FOiB7XHJcbiAgICAgICAgICAgIGlmIChnYW1lLmNyZWF0b3IgPT09IHBsYXllcklkKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgZXZlcnkgcGxheWVyIGFjY291bnQgZnJvbSB0aGUgZ2FtZVxyXG4gICAgICAgICAgICAgICAgT2JqZWN0LnZhbHVlcyhnYW1lLnBsYXllcnMpLmZvckVhY2gocCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYWNjb3VudCA9IEFjY291bnREQi5nZXRBY2NvdW50KHAuaWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhY2NvdW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjY291bnQuam9pbmVkR2FtZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBkaXJ0eS5hY2NvdW50cyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRGVsZXRlIGdhbWVcclxuICAgICAgICAgICAgICAgIEdhbWVEQi5kZWxldGVHYW1lKGdhbWVJZCk7XHJcbiAgICAgICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWVJZCwgeyBkZWxldGVkOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5TVEFSVF9HQU1FOlxyXG4gICAgICAgICAgICAvLyBJbml0aWFsaXplIHBsYXllcnMgd2l0aCB0aGVpciBob21lIHBsYW5ldHMuXHJcbiAgICAgICAgICAgIE9iamVjdC52YWx1ZXMoZ2FtZS5wbGF5ZXJzKS5mb3JFYWNoKHBsYXllciA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLmZhY3Rpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBmYWN0aW9uUGxhbmV0cyA9IFBsYW5ldERCLmdldEZhY3Rpb25QbGFuZXRzKHBsYXllci5mYWN0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5ZXIucGxhbmV0cyA9IGZhY3Rpb25QbGFuZXRzLm1hcChwID0+IHAubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZmFjdGlvblBsYW5ldHMuZm9yRWFjaChwID0+IChnYW1lLnBsYW5ldHNbcC5uYW1lXS5vd25lciA9IHBsYXllci5pZCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGdhbWUuc3RhdHVzLnN0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWVJZCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuU1RPUF9HQU1FOlxyXG4gICAgICAgICAgICBnYW1lLnN0YXR1cy5zdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHN0YXR1czogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUExBWUVSX0pPSU5fR0FNRToge1xyXG4gICAgICAgICAgICBjb25zdCB7IHBsYXllcnMsIHN0YXR1cyB9ID0gZ2FtZTtcclxuICAgICAgICAgICAgaWYgKCFzdGF0dXMuc3RhcnRlZCB8fCAoc3RhdHVzLnN0YXJ0ZWQgJiYgcGxheWVyc1twbGF5ZXJJZF0pKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBBZGQgcGxheWVyIHRvIHRoZSBnYW1lXHJcbiAgICAgICAgICAgICAgICBHYW1lREIuYWRkUGxheWVyKGdhbWVJZCwgcGxheWVySWQpO1xyXG4gICAgICAgICAgICAgICAgbWFya0dhbWVEaXJ0eShnYW1lSWQsIHsgcGxheWVyczogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhY2NvdW50ID0gQWNjb3VudERCLmdldEFjY291bnQocGxheWVySWQpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFjY291bnQpIHtcclxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50LmpvaW5lZEdhbWUgPSBnYW1lSWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlydHkuYWNjb3VudHMgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgc2VuZERhdGEoeyB3cywgdHlwZTogTWVzc2FnZVR5cGUuUExBWUVSX0pPSU5fR0FNRSwgZXJyb3I6IEVycm9yVHlwZS5HQU1FX1VOQUJMRV9UT19KT0lOIH0pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QTEFZRVJfTEVBVkVfR0FNRToge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgcGxheWVyIGZyb20gdGhlIGdhbWVcclxuICAgICAgICAgICAgR2FtZURCLnJlbW92ZVBsYXllcihnYW1lSWQsIHBsYXllcklkLCBCb29sZWFuKGRhdGEuZGVsZXRlUGxheWVyKSk7XHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYXllcnM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwbGF5ZXIgPSBBY2NvdW50REIuZ2V0QWNjb3VudChwbGF5ZXJJZCk7XHJcbiAgICAgICAgICAgIGlmIChwbGF5ZXIpIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5qb2luZWRHYW1lID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGRpcnR5LmFjY291bnRzID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuR0FNRV9TVEFUVVNfU0VUOiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgcm91bmQsIHBoYXNlLCB0dXJuLCBzcGVha2VyLCBwaWNrT3JkZXIsIHBpY2tUdXJuIH0gPSBkYXRhO1xyXG4gICAgICAgICAgICBjb25zdCB7IHN0YXR1cyB9ID0gZ2FtZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyb3VuZCA+IHN0YXR1cy5yb3VuZCkge1xyXG4gICAgICAgICAgICAgICAgT2JqZWN0LnZhbHVlcyhnYW1lLnBsYXllcnMpLmZvckVhY2gocCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcC5zdHJhdGVneUNhcmQgPSBTdHJhdGVneUNhcmRJbmRleC5OT05FO1xyXG4gICAgICAgICAgICAgICAgICAgIHAuc3RyYXRlZ3lDYXJkVGFrZW4gPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBwLnN0cmFnZXR5Q2FyZFVzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYXllcnM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHN0YXR1cy5yb3VuZCA9IHJvdW5kIHx8IHN0YXR1cy5yb3VuZDtcclxuICAgICAgICAgICAgc3RhdHVzLnBoYXNlID0gIWlzTmlsKHBoYXNlKSA/IHBoYXNlIDogc3RhdHVzLnBoYXNlO1xyXG4gICAgICAgICAgICBzdGF0dXMudHVybiA9IHR1cm4gfHwgc3RhdHVzLnR1cm47XHJcbiAgICAgICAgICAgIHN0YXR1cy5zcGVha2VyID0gc3BlYWtlciB8fCBzdGF0dXMuc3BlYWtlcjtcclxuICAgICAgICAgICAgc3RhdHVzLnBpY2tPcmRlciA9IHBpY2tPcmRlciB8fCBzdGF0dXMucGlja09yZGVyO1xyXG4gICAgICAgICAgICBzdGF0dXMucGlja1R1cm4gPSAhaXNOaWwocGlja1R1cm4pID8gcGlja1R1cm4gOiBzdGF0dXMucGlja1R1cm47XHJcbiAgICAgICAgICAgIGlmIChzdGF0dXMucGlja1R1cm4gPiBzdGF0dXMucGlja09yZGVyLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1cy5waWNrVHVybiA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0dXMucGlja09yZGVyWzBdICE9PSBzdGF0dXMuc3BlYWtlcikge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BlYWtlckluZGV4ID0gc3RhdHVzLnBpY2tPcmRlci5pbmRleE9mKHN0YXR1cy5zcGVha2VyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZVNwZWFrZXIgPSBzdGF0dXMucGlja09yZGVyLnNsaWNlKDAsIHNwZWFrZXJJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwb3N0U3BlYWtlciA9IHN0YXR1cy5waWNrT3JkZXIuc2xpY2Uoc3BlYWtlckluZGV4KTtcclxuICAgICAgICAgICAgICAgIHN0YXR1cy5waWNrT3JkZXIgPSBbLi4ucG9zdFNwZWFrZXIsIC4uLnByZVNwZWFrZXJdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWVJZCwgeyBzdGF0dXM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZvbGxvd2luZyBhY3Rpb25zIHJlcXVpcmUgYSBwbGF5ZXJcclxuICAgIGNvbnN0IHBsYXllcnMgPSBnYW1lLnBsYXllcnM7XHJcbiAgICBjb25zdCBwbGF5ZXIgPSBwbGF5ZXJzICYmIHBsYXllcnNbcGxheWVySWRdO1xyXG4gICAgaWYgKCFwbGF5ZXIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgLy8gUGxheWVyIFNldHVwIGFjdGlvbnNcclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBMQVlFUl9TRVRfQ09MT1I6XHJcbiAgICAgICAgICAgIHBsYXllci5jb2xvciA9IGRhdGEuY29sb3I7XHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYXllcnM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUExBWUVSX1NFVF9GQUNUSU9OOlxyXG4gICAgICAgICAgICBwbGF5ZXIuZmFjdGlvbiA9IGRhdGEuZmFjdGlvbk5hbWU7XHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYXllcnM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAvLyBTdHJhdGVneSBDYXJkIGFjdGlvbnNcclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBMQVlFUl9UQUtFX1NUUkFURUdZX0NBUkQ6IHtcclxuICAgICAgICAgICAgY29uc3Qgb3duZXIgPSBPYmplY3QudmFsdWVzKHBsYXllcnMpLmZpbmQocCA9PiBwLnN0cmF0ZWd5Q2FyZCA9PT0gZGF0YS5zdHJhdGVneUNhcmQpO1xyXG4gICAgICAgICAgICBpZiAob3duZXIgJiYgb3duZXIgIT09IHBsYXllcklkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHsgc3RhdHVzIH0gPSBnYW1lO1xyXG4gICAgICAgICAgICBjb25zdCB7IHBpY2tUdXJuLCBwaWNrT3JkZXIgfSA9IHN0YXR1cztcclxuXHJcbiAgICAgICAgICAgIHBsYXllci5zdHJhdGVneUNhcmQgPSBkYXRhLnN0cmF0ZWd5Q2FyZDtcclxuICAgICAgICAgICAgaWYgKCFwbGF5ZXIuc3RyYXRlZ3lDYXJkVGFrZW4pIHtcclxuICAgICAgICAgICAgICAgIHBsYXllci5zdHJhdGVneUNhcmRUYWtlbiA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXMucGlja1R1cm4gPSBwaWNrVHVybiA9PT0gcGlja09yZGVyLmxlbmd0aCAtIDEgPyAwIDogcGlja1R1cm4gKyAxO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWVJZCwgeyBwbGF5ZXJzOiB0cnVlLCBzdGF0dXM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QTEFZRVJfVVNFX1NUUkFURUdZX0NBUkQ6XHJcbiAgICAgICAgICAgIHBsYXllci5zdHJhZ2V0eUNhcmRVc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgbWFya0dhbWVEaXJ0eShnYW1lSWQsIHsgcGxheWVyczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUExBWUVSX1JFVFVSTl9TVFJBVEVHWV9DQVJEOlxyXG4gICAgICAgICAgICBwbGF5ZXIuc3RyYXRlZ3lDYXJkID0gU3RyYXRlZ3lDYXJkSW5kZXguTk9ORTtcclxuICAgICAgICAgICAgcGxheWVyLnN0cmFnZXR5Q2FyZFVzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgbWFya0dhbWVEaXJ0eShnYW1lSWQsIHsgcGxheWVyczogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIC8vIFBsYW5ldCBhY3Rpb25zXHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QTEFZRVJfVEFLRV9QTEFORVQ6IHtcclxuICAgICAgICAgICAgY29uc3QgeyBwbGFuZXRJZCB9ID0gZGF0YSB8fCB7fTtcclxuICAgICAgICAgICAgY29uc3QgcGxhbmV0cyA9IEdhbWVEQi5nZXRQbGFuZXRzQXJyYXkoZ2FtZUlkLCBwbGFuZXRJZCk7XHJcbiAgICAgICAgICAgIHBsYW5ldHMuZm9yRWFjaChwID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXZPd25lciA9IHAub3duZXI7XHJcbiAgICAgICAgICAgICAgICBwLm93bmVyID0gcGxheWVySWQ7XHJcbiAgICAgICAgICAgICAgICBwLnJlZnJlc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnBsYW5ldHMucHVzaChwLm5hbWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHByZXZpb3VzUGxheWVyID0gcHJldk93bmVyICYmIHBsYXllcnNbcHJldk93bmVyXTtcclxuICAgICAgICAgICAgICAgIGlmIChwcmV2aW91c1BsYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHByZXZpb3VzUGxheWVyLnBsYW5ldHMgPSBwcmV2aW91c1BsYXllci5wbGFuZXRzLmZpbHRlcihwcCA9PiBwcCAhPT0gcC5uYW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBwbGF5ZXIucGxhbmV0cy5zb3J0KCk7XHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYW5ldHM6IHRydWUsIHBsYXllcnM6IHRydWUgfSk7XHJcblxyXG4gICAgICAgICAgICAvLyBUT0RPOiBTZW5kIG5vdGlmaWNhdGlvbnMgdG8gcHJldmlvdXMgb3duZXJzLlxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSBNZXNzYWdlVHlwZS5QTEFZRVJfTE9TVF9QTEFORVQ6IHtcclxuICAgICAgICAgICAgY29uc3QgeyBwbGFuZXRJZCB9ID0gZGF0YSB8fCB7fTtcclxuICAgICAgICAgICAgY29uc3QgcGxhbmV0cyA9IEdhbWVEQi5nZXRQbGFuZXRzQXJyYXkoZ2FtZUlkLCBwbGFuZXRJZCk7XHJcbiAgICAgICAgICAgIHBsYW5ldHMuZm9yRWFjaChwID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChwLm93bmVyID09PSBwbGF5ZXJJZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHAub3duZXIgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHBsYW5ldElkQXJyYXkgPSBBcnJheS5pc0FycmF5KHBsYW5ldElkKSA/IHBsYW5ldElkIDogW3BsYW5ldElkXTtcclxuICAgICAgICAgICAgcGxheWVyLnBsYW5ldHMgPSBwbGF5ZXIucGxhbmV0cy5maWx0ZXIocCA9PiAhcGxhbmV0SWRBcnJheS5pbmNsdWRlcyhwKSkuc29ydCgpO1xyXG4gICAgICAgICAgICBtYXJrR2FtZURpcnR5KGdhbWVJZCwgeyBwbGFuZXRzOiB0cnVlLCBwbGF5ZXJzOiB0cnVlIH0pO1xyXG5cclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgTWVzc2FnZVR5cGUuUExBWUVSX0VYSEFVU1RfUExBTkVUOiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHsgcGxhbmV0SWQgfSA9IGRhdGEgfHwge307XHJcbiAgICAgICAgICAgIGNvbnN0IHBsYW5ldHMgPSBHYW1lREIuZ2V0UGxhbmV0c0FycmF5KGdhbWVJZCwgcGxhbmV0SWQpLmZpbHRlcihwID0+IHAub3duZXIgPT09IHBsYXllcklkKTtcclxuICAgICAgICAgICAgcGxhbmV0cy5mb3JFYWNoKHAgPT4gKHAucmVmcmVzaGVkID0gZmFsc2UpKTtcclxuXHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYW5ldHM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlIE1lc3NhZ2VUeXBlLlBMQVlFUl9SRUZSRVNIX1BMQU5FVDoge1xyXG4gICAgICAgICAgICBjb25zdCB7IHBsYW5ldElkIH0gPSBkYXRhIHx8IHt9O1xyXG4gICAgICAgICAgICBjb25zdCBwbGFuZXRzID0gR2FtZURCLmdldFBsYW5ldHNBcnJheShnYW1lSWQsIHBsYW5ldElkKS5maWx0ZXIocCA9PiBwLm93bmVyID09PSBwbGF5ZXJJZCk7XHJcbiAgICAgICAgICAgIHBsYW5ldHMuZm9yRWFjaChwID0+IChwLnJlZnJlc2hlZCA9IHRydWUpKTtcclxuXHJcbiAgICAgICAgICAgIG1hcmtHYW1lRGlydHkoZ2FtZUlkLCB7IHBsYW5ldHM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgIH1cclxufVxyXG4iXSwibWFwcGluZ3MiOiJBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTsiLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///./src/server/handleMessage.ts\n");

/***/ }),

/***/ "./src/server/index.ts":
/*!*****************************!*\
  !*** ./src/server/index.ts ***!
  \*****************************/
/*! no exports provided */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! cors */ \"cors\");\n/* harmony import */ var cors__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(cors__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! express */ \"express\");\n/* harmony import */ var express__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(express__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var ip__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ip */ \"ip\");\n/* harmony import */ var ip__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(ip__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! path */ \"path\");\n/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_3__);\n/* harmony import */ var _appData__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./appData */ \"./src/server/appData.ts\");\n/* harmony import */ var _WebSocketServer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./WebSocketServer */ \"./src/server/WebSocketServer.ts\");\n\r\n\r\n\r\n\r\n//\r\n\r\n\r\nconst app = express__WEBPACK_IMPORTED_MODULE_1___default()();\r\nconst port = process.env.PORT || 80;\r\nconst distDir = path__WEBPACK_IMPORTED_MODULE_3___default.a.join(__dirname, '../dist');\r\nconst html = path__WEBPACK_IMPORTED_MODULE_3___default.a.join(distDir, 'index.html');\r\nObject(_appData__WEBPACK_IMPORTED_MODULE_4__[\"default\"])();\r\nObject(_WebSocketServer__WEBPACK_IMPORTED_MODULE_5__[\"default\"])(app);\r\nconst publicPath = express__WEBPACK_IMPORTED_MODULE_1___default.a.static(distDir);\r\napp.use(publicPath);\r\napp.use(cors__WEBPACK_IMPORTED_MODULE_0___default()());\r\n// Add HMR for dev\r\n// if (process.env.NODE_ENV !== 'production') {\r\n//     const config = webpackConfig as webpack.Configuration;\r\n//     const compiler = webpack(config);\r\n//     const { publicPath = '' } = (config && config.output) || {};\r\n//     app.use(webpackDevMiddleware(compiler, { publicPath }));\r\n//     app.use(webpackHotMiddleware(compiler));\r\n// }\r\napp.get('*', (req, res) => {\r\n    res.sendFile(html);\r\n});\r\napp.listen(port, () => {\r\n    console.log(`Server running on: ${ip__WEBPACK_IMPORTED_MODULE_2___default.a.address()}`);\r\n    console.log(`App listening on port: ${port}`);\r\n});\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2luZGV4LnRzLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL3NyYy9zZXJ2ZXIvaW5kZXgudHM/MDcxNiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29ycyBmcm9tICdjb3JzJztcclxuaW1wb3J0IGV4cHJlc3MgZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBpcCBmcm9tICdpcCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuLy8gVE9PRDogRmlndXJlIHRoaXMgb3V0LlxyXG4vLyB3ZWJwYWNrIGltcG9ydHMgZm9yIEhNUiBpbiBkZXZcclxuaW1wb3J0IHdlYnBhY2sgZnJvbSAnd2VicGFjayc7XHJcbmltcG9ydCB3ZWJwYWNrRGV2TWlkZGxld2FyZSBmcm9tICd3ZWJwYWNrLWRldi1taWRkbGV3YXJlJztcclxuaW1wb3J0IHdlYnBhY2tIb3RNaWRkbGV3YXJlIGZyb20gJ3dlYnBhY2staG90LW1pZGRsZXdhcmUnO1xyXG5pbXBvcnQgd2VicGFja0NvbmZpZyBmcm9tICcuLi8uLi93ZWJwYWNrLmNvbmZpZy5qcyc7XHJcbi8vXHJcblxyXG5pbXBvcnQgaW5pdGlhbGl6ZUFwcERhdGEgZnJvbSAnLi9hcHBEYXRhJztcclxuaW1wb3J0IGluaXRpYWxpemVXZWJTb2NrZXRTZXJ2ZXIgZnJvbSAnLi9XZWJTb2NrZXRTZXJ2ZXInO1xyXG5cclxuY29uc3QgYXBwOiBleHByZXNzLkFwcGxpY2F0aW9uID0gZXhwcmVzcygpO1xyXG5jb25zdCBwb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVCB8fCA4MDtcclxuY29uc3QgZGlzdERpciA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuLi9kaXN0Jyk7XHJcbmNvbnN0IGh0bWwgPSBwYXRoLmpvaW4oZGlzdERpciwgJ2luZGV4Lmh0bWwnKTtcclxuXHJcbmluaXRpYWxpemVBcHBEYXRhKCk7XHJcbmluaXRpYWxpemVXZWJTb2NrZXRTZXJ2ZXIoYXBwKTtcclxuXHJcbmNvbnN0IHB1YmxpY1BhdGggPSBleHByZXNzLnN0YXRpYyhkaXN0RGlyKTtcclxuYXBwLnVzZShwdWJsaWNQYXRoKTtcclxuYXBwLnVzZShjb3JzKCkpO1xyXG5cclxuLy8gQWRkIEhNUiBmb3IgZGV2XHJcbi8vIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XHJcbi8vICAgICBjb25zdCBjb25maWcgPSB3ZWJwYWNrQ29uZmlnIGFzIHdlYnBhY2suQ29uZmlndXJhdGlvbjtcclxuLy8gICAgIGNvbnN0IGNvbXBpbGVyID0gd2VicGFjayhjb25maWcpO1xyXG4vLyAgICAgY29uc3QgeyBwdWJsaWNQYXRoID0gJycgfSA9IChjb25maWcgJiYgY29uZmlnLm91dHB1dCkgfHwge307XHJcblxyXG4vLyAgICAgYXBwLnVzZSh3ZWJwYWNrRGV2TWlkZGxld2FyZShjb21waWxlciwgeyBwdWJsaWNQYXRoIH0pKTtcclxuLy8gICAgIGFwcC51c2Uod2VicGFja0hvdE1pZGRsZXdhcmUoY29tcGlsZXIpKTtcclxuLy8gfVxyXG5cclxuYXBwLmdldCgnKicsIChyZXE6IGV4cHJlc3MuUmVxdWVzdCwgcmVzOiBleHByZXNzLlJlc3BvbnNlKSA9PiB7XHJcbiAgICByZXMuc2VuZEZpbGUoaHRtbCk7XHJcbn0pO1xyXG5cclxuYXBwLmxpc3Rlbihwb3J0LCAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZyhgU2VydmVyIHJ1bm5pbmcgb246ICR7aXAuYWRkcmVzcygpfWApO1xyXG4gICAgY29uc29sZS5sb2coYEFwcCBsaXN0ZW5pbmcgb24gcG9ydDogJHtwb3J0fWApO1xyXG59KTtcclxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFRQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/index.ts\n");

/***/ }),

/***/ "./src/server/log.ts":
/*!***************************!*\
  !*** ./src/server/log.ts ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, \"default\", function() { return log; });\n/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! moment */ \"moment\");\n/* harmony import */ var moment__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(moment__WEBPACK_IMPORTED_MODULE_0__);\n\r\nfunction log(message, data) {\r\n    const time = moment__WEBPACK_IMPORTED_MODULE_0___default()(Date.now()).format('HH:mm:ss');\r\n    console.log(`>>> ${time} | ${message}`, data);\r\n}\r\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiLi9zcmMvc2VydmVyL2xvZy50cy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9zcmMvc2VydmVyL2xvZy50cz9lYTRhIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50JztcclxuXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGxvZyhtZXNzYWdlOiBzdHJpbmcsIGRhdGE6IGFueSkge1xyXG4gICAgY29uc3QgdGltZSA9IG1vbWVudChEYXRlLm5vdygpKS5mb3JtYXQoJ0hIOm1tOnNzJyk7XHJcbiAgICBjb25zb2xlLmxvZyhgPj4+ICR7dGltZX0gfCAke21lc3NhZ2V9YCwgZGF0YSk7XHJcbn1cclxuIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBRUE7QUFDQTtBQUNBO0FBQ0E7Iiwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///./src/server/log.ts\n");

/***/ }),

/***/ "@material-ui/core":
/*!************************************!*\
  !*** external "@material-ui/core" ***!
  \************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"@material-ui/core\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQG1hdGVyaWFsLXVpL2NvcmUuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJAbWF0ZXJpYWwtdWkvY29yZVwiP2I2OTkiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiQG1hdGVyaWFsLXVpL2NvcmVcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///@material-ui/core\n");

/***/ }),

/***/ "cors":
/*!***********************!*\
  !*** external "cors" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"cors\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ycy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9leHRlcm5hbCBcImNvcnNcIj83ZTllIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImNvcnNcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///cors\n");

/***/ }),

/***/ "express":
/*!**************************!*\
  !*** external "express" ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"express\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhwcmVzcy5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9leHRlcm5hbCBcImV4cHJlc3NcIj8yMmZlIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImV4cHJlc3NcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///express\n");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"fs\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnMuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJmc1wiP2E0MGQiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZnNcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///fs\n");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"http\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9leHRlcm5hbCBcImh0dHBcIj84ZDE5Il0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImh0dHBcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///http\n");

/***/ }),

/***/ "ip":
/*!*********************!*\
  !*** external "ip" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"ip\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXAuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJpcFwiPzhmMjEiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiaXBcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///ip\n");

/***/ }),

/***/ "lodash/cloneDeep":
/*!***********************************!*\
  !*** external "lodash/cloneDeep" ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash/cloneDeep\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9kYXNoL2Nsb25lRGVlcC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9leHRlcm5hbCBcImxvZGFzaC9jbG9uZURlZXBcIj8xYTllIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImxvZGFzaC9jbG9uZURlZXBcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///lodash/cloneDeep\n");

/***/ }),

/***/ "lodash/isEmpty":
/*!*********************************!*\
  !*** external "lodash/isEmpty" ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash/isEmpty\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9kYXNoL2lzRW1wdHkuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJsb2Rhc2gvaXNFbXB0eVwiP2Q3YzQiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwibG9kYXNoL2lzRW1wdHlcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///lodash/isEmpty\n");

/***/ }),

/***/ "lodash/isNil":
/*!*******************************!*\
  !*** external "lodash/isNil" ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash/isNil\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9kYXNoL2lzTmlsLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibG9kYXNoL2lzTmlsXCI/Y2E5NSJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJsb2Rhc2gvaXNOaWxcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///lodash/isNil\n");

/***/ }),

/***/ "lodash/uniqueId":
/*!**********************************!*\
  !*** external "lodash/uniqueId" ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"lodash/uniqueId\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9kYXNoL3VuaXF1ZUlkLmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibG9kYXNoL3VuaXF1ZUlkXCI/NDA0OCJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJsb2Rhc2gvdW5pcXVlSWRcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///lodash/uniqueId\n");

/***/ }),

/***/ "moment":
/*!*************************!*\
  !*** external "moment" ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"moment\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9tZW50LmpzIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vL2V4dGVybmFsIFwibW9tZW50XCI/YmQ3NiJdLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJtb21lbnRcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///moment\n");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"path\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF0aC5qcyIsInNvdXJjZXMiOlsid2VicGFjazovLy9leHRlcm5hbCBcInBhdGhcIj83NGJiIl0sInNvdXJjZXNDb250ZW50IjpbIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcInBhdGhcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///path\n");

/***/ }),

/***/ "ws":
/*!*********************!*\
  !*** external "ws" ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"ws\");//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3MuanMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vZXh0ZXJuYWwgXCJ3c1wiPzE1YTUiXSwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwid3NcIik7Il0sIm1hcHBpbmdzIjoiQUFBQSIsInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///ws\n");

/***/ })

/******/ });