/**
 * BlobCache.js
 *
 * Copyright, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * ...
 *
 * @private
 * @class tinymce.file.BlobCache
 */
define("tinymce/file/BlobCache", [
	"tinymce/util/Tools"
], function(Tools) {
	return function() {
		var cache = [], constant = Tools.constant;

		function create(id, blob, base64) {
			return {
				id: constant(id),
				blob: constant(blob),
				base64: constant(base64),
				blobUri: constant(URL.createObjectURL(blob))
			};
		}

		function add(blobInfo) {
			if (!get(blobInfo.id())) {
				cache.push(blobInfo);
			}
		}

		function get(id) {
			return findFirst(function(cachedBlobInfo) {
				return cachedBlobInfo.id() === id;
			});
		}

		function findFirst(predicate) {
			return Tools.grep(cache, predicate)[0];
		}

		function destroy() {
			Tools.each(cache, function(cachedBlobInfo) {
				URL.revokeObjectURL(cachedBlobInfo.blobUri());
			});

			cache = [];
		}

		return {
			create: create,
			add: add,
			get: get,
			findFirst: findFirst,
			destroy: destroy
		};
	};
});