(function(){tinymce.create('tinymce.plugins.StylePlugin',{StylePlugin:function(ed,url){ed.addCommand('mceStyleProps',function(){ed.windowManager.open({file:url+'/props.htm',width:480+ed.getLang('styleprops.delta_width',0),height:320+ed.getLang('styleprops.delta_height',0),inline:1},{plugin_url:url});});ed.addCommand('mceSetElementStyle',function(ui,v){if(e=ed.selection.getNode()){ed.dom.setAttrib(e,'style',v);ed.execCommand('mceRepaint');}});ed.addButton('styleprops','style.desc','mceStyleProps');},getInfo:function(){return{longname:'Style',author:'Moxiecode Systems AB',authorurl:'http://tinymce.moxiecode.com',infourl:'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/style',version:tinymce.majorVersion+"."+tinymce.minorVersion};}});tinymce.PluginManager.add('style',tinymce.plugins.StylePlugin);})();