/**
 * editor_plugin_src.js
 *
 * Copyright 2009, Moxiecode Systems AB
 * Released under LGPL License.
 *
 * License: http://tinymce.moxiecode.com/license
 * Contributing: http://tinymce.moxiecode.com/contributing
 */

(function() {
	var TreeWalker = tinymce.dom.TreeWalker;
	var externalName = 'contenteditable', internalName = 'data-mce-' + externalName;

	function handleContentEditableSelection(ed) {
		var dom = ed.dom, selection = ed.selection, invisibleChar, caretContainerId = 'mce_noneditablecaret';

		// Setup invisible character use zero width space on Gecko since it doesn't change the height of the container
		invisibleChar = tinymce.isGecko ? '\u200B' : '\uFEFF';

		// Returns the content editable state of a node "true/false" or null
		function getContentEditable(node) {
			var contentEditable;

			// Ignore non elements
			if (node.nodeType === 1) {
				// Check for fake content editable
				contentEditable = node.getAttribute(internalName);
				if (contentEditable && contentEditable !== "inherit") {
					return contentEditable;
				}

				// Check for real content editable
				contentEditable = node.contentEditable;
				if (contentEditable !== "inherit") {
					return contentEditable;
				}
			}

			return null;
		};

		// Returns the noneditable parent or null if there is a editable before it or if it wasn't found
		function getNonEditableParent(node) {
			var state;

			while (node) {
				state = getContentEditable(node);
				if (state) {
					return state  === "false" ? node : null;
				}

				node = node.parentNode;
			}
		};

		// Get caret container parent for the specified node
		function getParentCaretContainer(node) {
			while (node) {
				if (node.id === caretContainerId) {
					return node;
				}

				node = node.parentNode;
			}
		};

		// Finds the first text node in the specified node
		function findFirstTextNode(node) {
			var walker;

			if (node) {
				walker = new TreeWalker(node, node);

				for (node = walker.current(); node; node = walker.next()) {
					if (node.nodeType === 3) {
						return node;
					}
				}
			}
		};

		// Insert caret container before/after target or expand selection to include block
		function insertCaretContainerOrExpandToBlock(target, before) {
			var caretContainer, rng;

			// Select block
			if (dom.isBlock(target)) {
				selection.select(target);
				return;
			}

			rng = dom.createRng();

			if (getContentEditable(target) === "true") {
				if (!target.firstChild) {
					target.appendChild(ed.getDoc().createTextNode('\u00a0'));
				}

				target = target.firstChild;
				before = true;
			}

			caretContainer = dom.create('span', {id: caretContainerId, 'data-mce-bogus': true, style:'border: 1px solid red'}, invisibleChar);

			if (before) {
				target.parentNode.insertBefore(caretContainer, target);
			} else {
				dom.insertAfter(caretContainer, target);
			}

			rng.setStart(caretContainer.firstChild, 1);
			rng.collapse(true);
			selection.setRng(rng);

			return caretContainer;
		};

		// Removes any caret container except the one we might be in
		function removeCaretContainer(caretContainer) {
			var child, currentCaretContainer, lastContainer;

			if (caretContainer) {
					rng = selection.getRng(true);
					rng.setStartBefore(caretContainer);
					rng.setEndBefore(caretContainer);

					child = findFirstTextNode(caretContainer);
					if (child && child.nodeValue.charAt(0) == invisibleChar) {
						child = child.deleteData(0, 1);
					}

					dom.remove(caretContainer, true);

					selection.setRng(rng);
			} else {
				currentCaretContainer = getParentCaretContainer(selection.getStart());
				while ((caretContainer = dom.get(caretContainerId)) && caretContainer !== lastContainer) {
					if (currentCaretContainer !== caretContainer) {
						child = findFirstTextNode(caretContainer);
						if (child && child.nodeValue.charAt(0) == invisibleChar) {
							child = child.deleteData(0, 1);
						}

						dom.remove(caretContainer, true);
					}

					lastContainer = caretContainer;
				}
			}
		};

		// Modifies the selection to include contentEditable false elements or insert caret containers
		function moveSelection() {
			var nonEditableStart, nonEditableEnd, isCollapsed, rng, element;

			// Checks if there is any contents to the left/right side of caret returns the noneditable element or any editable element if it finds one inside
			function hasSideContent(element, left) {
				var container, offset, walker, node, len;

				container = rng.startContainer;
				offset = rng.startOffset;

				// If endpoint is in middle of text node then expand to beginning/end of element
				if (container.nodeType == 3) {
					len = container.nodeValue.length;
					if ((offset > 0 && offset < len) || (left ? offset == len : offset == 0)) {
						return;
					}
				} else {
					// Can we resolve the node by index
					if (offset < container.childNodes.length) {
						// Browser represents caret position as the offset at the start of an element. When moving right
						// this is the element we are moving into so we consider our container to be child node at offset-1
						var pos = !left && offset > 0 ? offset-1 : offset;
						container = container.childNodes[pos];
						if (container.hasChildNodes()) {
							container = container.firstChild;
						}
					} else {
						// If not then the caret is at the last position in it's container and the caret container should be inserted after the noneditable element
						return !left ? element : null;
					}
				}

				// Walk left/right to look for contents
				walker = new TreeWalker(container, element);
				while (node = walker[left ? 'prev' : 'next']()) {
					if (node.nodeType === 3 && node.nodeValue.length > 0) {
						return;
					} else if (getContentEditable(node) === "true") {
						// Found contentEditable=true element return this one to we can move the caret inside it
						return node;
					}
				}

				return element;
			};

			// Remove any existing caret containers
			removeCaretContainer();

			// Get noneditable start/end elements
			isCollapsed = selection.isCollapsed();
			nonEditableStart = getNonEditableParent(selection.getStart());
			nonEditableEnd = getNonEditableParent(selection.getEnd());

			// Is any fo the range endpoints noneditable
			if (nonEditableStart || nonEditableEnd) {
				rng = selection.getRng(true);

				// If it's a caret selection then look left/right to see if we need to move the caret out side or expand
				if (isCollapsed) {
					nonEditableStart = nonEditableStart || nonEditableEnd;

					if (element = hasSideContent(nonEditableStart, true)) {
						// We have no contents to the left of the caret then insert a caret container before the noneditable element
						insertCaretContainerOrExpandToBlock(element, true);
					} else if (element = hasSideContent(nonEditableStart, false)) {
						// We have no contents to the right of the caret then insert a caret container after the noneditable element
						insertCaretContainerOrExpandToBlock(element, false);
					} else {
						// We are in the middle of a noneditable so expand to select it
						selection.select(nonEditableStart);
					}
				} else {
					rng = selection.getRng(true);

					// Expand selection to include start non editable element
					if (nonEditableStart) {
						rng.setStartBefore(nonEditableStart);
					}

					// Expand selection to include end non editable element
					if (nonEditableEnd) {
						rng.setEndAfter(nonEditableEnd);
					}

					selection.setRng(rng);
				}
			}
		};

		function handleKey(ed, e) {
			var keyCode = e.keyCode, nonEditableParent, caretContainer, startElement, endElement;

			function getNonEmptyTextNodeSibling(node, prev) {
				while (node = node[prev ? 'previousSibling' : 'nextSibling']) {
					if (node.nodeType !== 3 || node.nodeValue.length > 0) {
						return node;
					}
				}
			};

			startElement = selection.getStart()
			endElement = selection.getEnd();

			// Disable all key presses in contentEditable=false except delete or backspace
			nonEditableParent = getNonEditableParent(startElement) || getNonEditableParent(endElement);
			if (nonEditableParent && (keyCode < 112 || keyCode > 124) && keyCode != 46 && keyCode != 8) {
				e.preventDefault();

				// Arrow left/right select the element and collapse left/right
				if (keyCode == 37 || keyCode == 39) {
					selection.select(nonEditableParent);
					selection.collapse(keyCode == 37);
				}
			} else {
				// Is arrow left/right, backspace or delete
				if (keyCode == 37 || keyCode == 39 || keyCode == 8 || keyCode == 46) {
					caretContainer = getParentCaretContainer(startElement);
					if (caretContainer) {
						// Arrow left or backspace
						if (keyCode == 37 || keyCode == 8) {
							nonEditableParent = getNonEmptyTextNodeSibling(caretContainer, true);

							if (nonEditableParent && getContentEditable(nonEditableParent) === "false") {
								e.preventDefault();

								if (keyCode == 37) {
									selection.select(nonEditableParent);
									selection.collapse(true);
								} else {
									dom.remove(nonEditableParent);
								}
							} else {
								removeCaretContainer(caretContainer);
							}
						}

						// Arrow right or delete
						if (keyCode == 39 || keyCode == 46) {
							nonEditableParent = getNonEmptyTextNodeSibling(caretContainer);

							if (nonEditableParent && getContentEditable(nonEditableParent) === "false") {
								e.preventDefault();

								if (keyCode == 39) {
									selection.select(nonEditableParent);
									selection.collapse(false);
								} else {
									dom.remove(nonEditableParent);
								}
							} else {
								removeCaretContainer(caretContainer);
							}
						}
					}
				}
			}
		};

		ed.onMouseUp.addToTop(moveSelection);
		ed.onKeyDown.addToTop(handleKey);
		ed.onKeyUp.addToTop(moveSelection);
	};

	tinymce.create('tinymce.plugins.NonEditablePlugin', {
		init : function(ed, url) {
			var editClass, nonEditClass;

			editClass = " " + tinymce.trim(ed.getParam("noneditable_editable_class", "mceEditable")) + " ";
			nonEditClass = " " + tinymce.trim(ed.getParam("noneditable_noneditable_class", "mceNonEditable")) + " ";

			ed.onPreInit.add(function() {
				handleContentEditableSelection(ed);

				// Apply contentEditable true/false on elements with the noneditable/editable classes
				ed.parser.addAttributeFilter('class', function(nodes) {
					var i = nodes.length, className, node;

					while (i--) {
						node = nodes[i];
						className = " " + node.attr("class") + " ";

						if (className.indexOf(editClass) !== -1) {
							node.attr(internalName, "true");
						} else if (className.indexOf(nonEditClass) !== -1) {
							node.attr(internalName, "false");
						}
					}
				});

				// Remove internal name
				ed.serializer.addAttributeFilter(internalName, function(nodes, name) {
					var i = nodes.length;

					while (i--) {
						nodes[i].attr(name, null);
					}
				});
			});
		},

		getInfo : function() {
			return {
				longname : 'Non editable elements',
				author : 'Moxiecode Systems AB',
				authorurl : 'http://tinymce.moxiecode.com',
				infourl : 'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/noneditable',
				version : tinymce.majorVersion + "." + tinymce.minorVersion
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('noneditable', tinymce.plugins.NonEditablePlugin);
})();