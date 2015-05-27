/**
 * ImageScanner.js
 *
 * Copyright, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://www.tinymce.com/license
 * Contributing: http://www.tinymce.com/contributing
 */

/**
 * Finds images with data uris or blob uris. If data uris are found it will convert them into blob uris.
 *
 * @private
 * @class tinymce.file.ImageScanner
 */
define("tinymce/file/ImageScanner", [
	"tinymce/util/Promise",
	"tinymce/util/Tools",
	"tinymce/file/Conversions"
], function(Promise, Tools, Conversions) {
	function mapAsync(array, fn) {
		return new Promise(function(resolve) {
			var result = [];

			function next(index) {
				fn(array[index], function(value) {
					result.push(value);

					if (index < array.length - 1) {
						next(index + 1);
					} else {
						resolve(result);
					}
				});
			}

			if (array.length === 0) {
				resolve(result);
			} else {
				next(0);
			}
		});
	}

	return {
		findAll: function(elm, blobCache) {
			function imageToBlobInfo(img, resolve) {
				var base64, blobInfo, blobInfoId = 'id';

				base64 = Conversions.parseDataUri(img.src).data;
				blobInfo = blobCache.findFirst(function(cachedBlobInfo) {
					return cachedBlobInfo.base64() === base64;
				});

				if (blobInfo) {
					resolve({
						image: img,
						blobInfo: blobInfo
					});
				} else {
					Conversions.uriToBlob(img.src).then(function(blob) {
						var blobInfo = blobCache.create(blobInfoId, blob, base64);

						blobCache.add(blobInfo);

						resolve({
							image: img,
							blobInfo: blobInfo
						});
					});
				}
			}

			return mapAsync(Tools.filter(elm.getElementsByTagName('img'), function(img) {
				return img.src && img.src.indexOf('data:') === 0;
			}), imageToBlobInfo);
		}
	};
});