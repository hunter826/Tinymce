/**
 * $Id$
 *
 * @author Moxiecode
 * @copyright Copyright � 2004-2007, Moxiecode Systems AB, All rights reserved.
 */

(function() {
	var DOM = tinymce.DOM;

	tinymce.create('tinymce.plugins.FullScreenPlugin', {
		FullScreenPlugin : function(ed, url) {
			var t = this, s = {}, vp;

			t.editor = ed;

			// Register commands
			ed.addCommand('mceFullScreen', function() {
				var win;

				if (ed.getParam('fullscreen_is_enabled')) {
					if (ed.getParam('fullscreen_new_window'))
						closeFullscreen(); // Call to close in new window
					else {
						window.setTimeout(function() {
							tinyMCE.get(ed.getParam('fullscreen_editor_id')).setContent(ed.getContent({format : 'raw'}), {format : 'raw'});
							tinyMCE.remove(ed);
							DOM.remove('mce_fullscreen_container');
							DOM.setStyle(document.body, 'overflow', ed.getParam('fullscreen_overflow'));
						}, 10);
					}
					return;
				}

				if (ed.getParam('fullscreen_new_window')) {
					win = window.open(url + "/fullscreen.htm", "mceFullScreenPopup", "fullscreen=yes,menubar=no,toolbar=no,scrollbars=no,resizable=no,left=0,top=0,width=" + screen.availWidth + ",height=" + screen.availHeight);
					try {
						win.resizeTo(screen.availWidth, screen.availHeight);
					} catch (e) {
						// Ignore
					}
				} else {
					vp = DOM.getViewPort();
					n = DOM.add(document.body, 'div', {id : 'mce_fullscreen_container', style : 'position:absolute;top:0;left:0;width:' + vp.w + 'px;height:' + vp.h + 'px;z-index:4000;'});
					DOM.add(n, 'div', {id : 'mce_fullscreen'});
					s.fullscreen_overflow = DOM.getStyle(document.body, 'overflow', 1) || 'auto';
					DOM.setStyle(document.body, 'overflow', 'hidden');
					t.fullscreenElement = new tinymce.dom.Element('mce_fullscreen_container');
					t.fullscreenElement.update();

					tinymce.each(ed.settings, function(v, n) {
						s[n] = v;
					});

					s.id = 'mce_fullscreen';
					s.width = n.clientWidth;
					s.height = n.clientHeight - 15;
					s.fullscreen_is_enabled = true;
					s.fullscreen_editor_id = ed.id;
					s.theme_advanced_resizing = false;

					tinymce.each(ed.getParam('fullscreen_settings'), function(v, k) {
						s[k] = v;
					});

					t.fullscreenEditor = new tinymce.Editor('mce_fullscreen', s);
					t.fullscreenEditor.onInit.add(function() {
						t.fullscreenEditor.setContent(ed.getContent({format : 'raw'}), {format : 'raw'});
					});

					t.fullscreenEditor.render();
					tinyMCE.add(t.fullscreenEditor);
				}
			});

			// Register buttons
			ed.addButton('fullscreen', 'fullscreen.desc', 'mceFullScreen');

			ed.onNodeChange.add(function(cm) {
				cm.setActive('fullscreen', ed.getParam('fullscreen_is_enabled'));
			});
		},

		getInfo : function() {
			return {
				longname : 'Fullscreen',
				author : 'Moxiecode Systems AB',
				authorurl : 'http://tinymce.moxiecode.com',
				infourl : 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/fullscreen',
				version : tinymce.majorVersion + "." + tinymce.minorVersion
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('fullscreen', tinymce.plugins.FullScreenPlugin);
})();