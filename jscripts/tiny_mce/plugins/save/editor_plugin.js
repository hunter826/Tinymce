tinyMCE.importPluginLanguagePack('save');var TinyMCE_SavePlugin={getInfo:function(){return{longname:'Save',author:'Moxiecode Systems AB',authorurl:'http://tinymce.moxiecode.com',infourl:'http://wiki.moxiecode.com/index.php/TinyMCE:Plugins/save',version:tinyMCE.majorVersion+"."+tinyMCE.minorVersion}},initInstance:function(inst){inst.addShortcut('ctrl','s','lang_save_desc','mceSave')},getControlHTML:function(cn){switch(cn){case"save":return tinyMCE.getButtonHTML(cn,'lang_save_desc','{$pluginurl}/images/save.gif','mceSave')}return""},execCommand:function(editor_id,element,command,user_interface,value){switch(command){case"mceSave":return this._save(editor_id,element,command,user_interface,value)}return false},_save:function(){var inst,formObj,os,i,elementId;if(tinyMCE.getParam("fullscreen_is_enabled"))return true;inst=tinyMCE.selectedInstance;formObj=inst.formElement.form;if(tinyMCE.getParam("save_enablewhendirty")&&!inst.isDirty())return true;if(formObj){tinyMCE.triggerSave();if((os=tinyMCE.getParam("save_onsavecallback"))){if(eval(os+'(inst);')){inst.startContent=tinyMCE.trim(inst.getBody().innerHTML);tinyMCE.triggerNodeChange(false,true)}return true}for(i=0;i<formObj.elements.length;i++){elementId=formObj.elements[i].name?formObj.elements[i].name:formObj.elements[i].id;if(elementId.indexOf('mce_editor_')==0)formObj.elements[i].disabled=true}inst.isNotDirty=true;if(formObj.onsubmit==null||formObj.onsubmit()!=false)inst.formElement.form.submit();tinyMCE.triggerNodeChange(false,true)}else alert("Error: No form element found.");return true},handleNodeChange:function(editor_id,node,undo_index,undo_levels,visual_aid,any_selection){var inst;if(tinyMCE.getParam("fullscreen_is_enabled")){tinyMCE.switchClass(editor_id+'_save','mceButtonDisabled');return true}if(tinyMCE.getParam("save_enablewhendirty")){inst=tinyMCE.getInstanceById(editor_id);if(inst.isDirty()){tinyMCE.switchClass(editor_id+'_save','mceButtonNormal');return true}tinyMCE.switchClass(editor_id+'_save','mceButtonDisabled')}return true}};tinyMCE.addPlugin("save",TinyMCE_SavePlugin);