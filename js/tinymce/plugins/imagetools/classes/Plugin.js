define("tinymce/imagetoolsplugin/Plugin", [
	"tinymce/PluginManager",
	"tinymce/Env",
	"tinymce/util/Promise",
	"tinymce/imagetoolsplugin/ImageTools",
	"tinymce/imagetoolsplugin/Conversions",
	"tinymce/imagetoolsplugin/Dialog"
], function(PluginManager, Env, Promise, ImageTools, Conversions, Dialog) {
	PluginManager.add('imagetools', function(editor) {
		var count = 0;

		if (!Env.fileApi) {
			return;
		}

		/*
		function startCrop() {
			var imageRect, viewPortRect;

			imageRect = getSelectedImage().getBoundingClientRect();

			imageRect = {
				x: imageRect.left,
				y: imageRect.top,
				w: imageRect.width,
				h: imageRect.height
			};

			viewPortRect = {
				x: 0,
				y: 0,
				w: editor.getBody().scrollWidth,
				h: editor.getBody().scrollHeight
			};

			cropRect = new CropRect(imageRect, viewPortRect, imageRect, editor.getBody());
			cropRect.toggleVisibility(true);

			editor.selection.getSel().removeAllRanges();
			editor.nodeChanged();
		}

		function stopCrop() {
			if (cropRect) {
				cropRect.destroy();
				cropRect = null;
			}
		}
		*/

		function getImageSize(img) {
			var width, height;

			function isPxValue(value) {
				return value.indexOf('px') == value.length - 2;
			}

			width = img.style.width;
			height = img.style.height;
			if (width || height) {
				if (isPxValue(width) && isPxValue(height)) {
					return {
						w: parseInt(width, 10),
						h: parseInt(height, 10)
					};
				}

				return null;
			}

			width = img.width;
			height = img.height;
			if (width && height) {
				return {
					w: parseInt(width, 10),
					h: parseInt(height, 10)
				};
			}

			return null;
		}

		function setImageSize(img, size) {
			var width, height;

			if (size) {
				width = img.style.width;
				height = img.style.height;

				if (width || height) {
					editor.$(img).css({
						width: size.w,
						height: size.h
					});
				} else {
					editor.$(img).attr({
						width: size.w,
						height: size.h
					});
				}
			}
		}

		function getNaturalImageSize(img) {
			return {
				w: img.naturalWidth,
				h: img.naturalHeight
			};
		}

		function getSelectedImage() {
			return editor.selection.getNode();
		}

		function createId() {
			return 'imagetools' + count++;
		}

		function findSelectedBlobInfo() {
			var blobInfo;

			blobInfo = editor.editorUpload.blobCache.getByUri(getSelectedImage().src);
			if (blobInfo) {
				return blobInfo;
			}

			return Conversions.imageToBlob(getSelectedImage()).then(function(blob) {
				return Conversions.blobToBase64(blob).then(function(base64) {
					var blobCache = editor.editorUpload.blobCache;
					var blobInfo = blobCache.create(createId(), blob, base64);
					blobCache.add(blobInfo);
					return blobInfo;
				});
			});
		}

		function updateSelectedImage(blob) {
			return Conversions.blobToDataUri(blob).then(function(dataUri) {
				var id, base64, blobCache, blobInfo, selectedImage;

				selectedImage = getSelectedImage();
				id = createId();
				blobCache = editor.editorUpload.blobCache;
				base64 = dataUri;

				blobInfo = blobCache.create(id, blob, base64);
				blobCache.add(blobInfo);

				editor.undoManager.transact(function() {
					editor.$(selectedImage).attr({
						src: blobInfo.blobUri(),
						"data-mce-src": blobInfo.blobUri()
					});
				});

				return blobInfo;
			});
		}

		function selectedImageOperation(fn) {
			return function() {
				return editor._scanForImages().then(findSelectedBlobInfo).then(fn).then(updateSelectedImage);
			};
		}

		function rotate(angle) {
			return function() {
				return selectedImageOperation(function(blobInfo) {
					var size = getImageSize(getSelectedImage());

					if (size) {
						setImageSize(getSelectedImage(), {
							w: size.h,
							h: size.w
						});
					}

					return ImageTools.rotate(blobInfo.blob(), angle);
				})();
			};
		}

		function flip(axis) {
			return function() {
				return selectedImageOperation(function(blobInfo) {
					return ImageTools.flip(blobInfo.blob(), axis);
				})();
			};
		}

		function editImageDialog() {
			var img = getSelectedImage(), originalSize = getNaturalImageSize(img);

			if (img) {
				Dialog.edit(img.src).then(function(blob) {
					return new Promise(function(resolve) {
						Conversions.blobToImage(blob).then(function(newImage) {
							var newSize = getNaturalImageSize(newImage);

							if (originalSize.w != newSize.w || originalSize.h != newSize.h) {
								setImageSize(img, newSize);
							}

							resolve(blob);
						});
					});
				}).then(updateSelectedImage, function() {});
			}
		}

		function addButtons() {
			editor.addButton('rotateleft', {
				title: 'Rotate counterclockwise',
				onclick: rotate(-90)
			});

			editor.addButton('rotateright', {
				title: 'Rotate clockwise',
				onclick: rotate(90)
			});

			editor.addButton('flipv', {
				title: 'Flip vertically',
				onclick: flip('v')
			});

			editor.addButton('fliph', {
				title: 'Flip horizontally',
				onclick: flip('h')
			});

			editor.addButton('editimage', {
				title: 'Edit image',
				onclick: editImageDialog
			});

			editor.addButton('imageoptions', {
				title: 'Image options',
				icon: 'options',
				cmd: 'mceImage'
			});

			/*
			editor.addButton('crop', {
				title: 'Crop',
				onclick: startCrop
			});
			*/
		}

		function addToolbars() {
			var toolbarItems = editor.settings.imagetools_toolbar;

			if (!toolbarItems) {
				toolbarItems = 'rotateleft rotateright | flipv fliph | crop editimage imageoptions';
			}

			editor.addContextToolbar(
				'img:not([data-mce-object],[data-mce-placeholder])',
				toolbarItems
			);
		}

		addButtons();
		addToolbars();
	});
});