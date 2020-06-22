'use strict';

import errors from "./errors";
import log from "./log";

const formUtil = {

    buildTargetPathForModel: function(basepath, action, modelname, suffix) {
        errors.requireValue("basepath", basepath);
        errors.requireValue("action", action);
        errors.requireValue("modelname", modelname);
        var target = basepath + '/' + action + '/' + modelname;
        if(suffix) {
            target = target + '/' + suffix;
        }
        return target;
    },
    
    buildTargetPath: function(props, formConfig, suffix) {
        return formUtil.buildTargetPathForModel(
                props.apibasepath, formConfig.action, formConfig.modelname, suffix);
    },

    /**
     * Update the appropriate form member with the value gotten from the newly 
     * created entity.
     * 
     * This method makes use of the {XMLHttpRequest.response.headers.Location}
     * property to determine which form member to update and also the id of the
     * newly created. The value of the form member selected for update is 
     * set to the value of the id of the newly created entity.
     * 
     * @param {XMLHttpRequest.response} response
     * @param {Form.formConfig} formConfig
     * @returns {boolean} true if form was updated with newly created, otherwise false
     */
    addNewlyCreatedToForm: function(response, formConfig) {
        var added = false;
        log.trace("Form#addNewlyCreatedToForm ", response.entity);
        if(response.entity && formConfig.form.members) {
            //Format:  {"Location":"http://localhost:9010/read/blog/1"}
            const loc = response.headers['Location'];
            log.trace("Form#addNewlyCreatedToForm Response.headers.Location: ", loc);
            if(loc) {
                formConfig.form.members.forEach((formMember, index) => {
                    var tgt = "/" + formMember.name + "/";
                    var pos = loc.indexOf(tgt);
                    if(pos === -1) {
                        tgt = "/" + formMember.name.toLowerCase() + "/";
                        pos = loc.indexOf(tgt);
                    }
                    if(pos !== -1) {
                        const idString = loc.substring(pos + tgt.length, loc.length);
                        const id = parseInt(idString, 10);
                        formMember.value = id;
                        added = true;
                        log.debug(() => "Form#addNewlyCreatedToForm set " + 
                                formConfig.form.name + "#" + formMember.name + 
                                " = " + formMember.value);
                    }
                });
            }
        }
        return added;
    },

    updateMultiChoice(formConfig, formMember, choiceMappings) {
        
        log.trace(() => "Updating Form." + formMember.name + 
                " with: " + JSON.stringify(choiceMappings));
        
        // FormMember format 
        // {"id":"country","name":"country","label":"Country","advice":null,
        //  "value":null,"choices":{"0":"NIGERIA"},"maxLength":-1,"size":35,
        //  "numberOfLines":1,"type":"text","referencedFormHref":null,
        //  "referencedForm":null,"optional":false,"multiChoice":true,
        //  "multiple":false,"displayName":"Country","required":true,
        //  "anyFieldSet":true,"formReference":false}
        const formMembersUpdate = formConfig.form.members.map((member, index) => {
            for(const key in choiceMappings) {
                const memberName = member['name'];
                if(memberName === key) {
                    const choices = choiceMappings[key];
                    log.trace(() => "Updating FormMember: " + memberName + 
                            " with choices: " + JSON.stringify(choices));
                    member.multiChoice = true;
                    member.choices = choices;
                    log.trace("FormMember Update: ", member);
                }
            }
            return member;
        });

        log.trace("FormMembers update: ", formMembersUpdate);
        
        const formUpdate = Object.assign({}, formConfig.form);
        formUpdate.members = formMembersUpdate;
        const formConfigUpdate = Object.assign({}, formConfig);
        formConfigUpdate.form = formUpdate;
        
        return formConfigUpdate;
    },

    /**
     * Update the first argument with values from the second.
     * Does one level of recursive update for objects. 
     * Does not support arrays.
     * @param {type} current
     * @param {type} update
     * @returns The first argument updated with values from the second argument.
     */
    updateObject: function(current, update) {

        const output = {};

        for(const name in update) {

            var value = current[name];
            const valueUpdate = update[name];
            
            let updatedValue;

            if(valueUpdate) {
                const type = typeof(valueUpdate);
                if(type === 'object') {
                    const temp = value ? Object.assign({}, value) : {};
                    updatedValue = Object.assign(temp, valueUpdate);
                }else{
                    updatedValue = valueUpdate;
                }
            }
            
            const logLevel = "trace";//name === "formConfig" ? "trace" : "debug";
            log.log(logLevel, "formUtil#updateObject " + name + " = " +
                    "\nCurrent: " + log.toMessage(value) + 
                    "\nUpdated: " + log.toMessage(updatedValue));

            output[name] = updatedValue;
        }

        return output;
    },
    
    /**
     * An update is only performed if the value exists in the source.
     * This prevents a situation where the server recieved <code>null</code> 
     * text as values.
     * @param {type} name The name of the property to update
     * @param {type} target The target for the new value
     * @param {type} source The source of the new value
     * @returns {undefined} Does not return anything
     */
    updateValue: function(name, target, source) {
        if(source[name] !== null && source[name] !== undefined) {
            target[name] = source[name];
        }
    },
    
    collectFormData: function(formConfig, collectInto = {}) {

        const formMembers = formConfig.form.members;

        formMembers.forEach((formMember, index) => {
            const value = formMember.value;
            if(value !== null && value !== undefined) {
                collectInto[formMember.name] = formMember.value;
            }
        });
        
        return collectInto;
    },
    
    collectConfigData: function(formConfig, collectInto = {}) {
        
        // collect special fields used by the api
        formUtil.updateValue('parentfid', collectInto, formConfig);
        formUtil.updateValue('fid', collectInto, formConfig);
        formUtil.updateValue('mid', collectInto, formConfig);
        formUtil.updateValue('targetOnCompletion', collectInto, formConfig);
        formUtil.updateValue('modelfields', collectInto, formConfig);
        log.trace("formUtil#collectConfigData. ", collectInto);
        
        return collectInto;
    },
    
    getIdForFormFieldAdvice: function(formMember) {
        return formMember.id + '-advice';
    },
    
    getIdForFormFieldMessage: function(formMember) {
        return formMember.id + '-message';
    },

    getIdForSelectOptionAt: function(formMember, index) {
        errors.requireValue("formMember", formMember);
        errors.requireValue("index", index);
        return formMember.id + '-' + index;
    },
    
    getIdForDefaultSelectOption: function(formMember) {
        errors.requireValue("formMember", formMember);
        return formMember.id + '-no-selection';
    },

    logFormConfig: function(formConfig, methodName, logLevel) {
        const form = formConfig === null ? null : formConfig.form;
        if(form !== null) {
            formUtil.logForm(form, methodName, logLevel);
        }
    },
    
    logForm: function(form, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'trace';
        }
        log.log(logLevel, () => 
            "formUtil->" + id + 
            "-> Form. name: " + (form ? form.name : null) + 
            ", members: " + (form ? form.memberNames : null)
        );
    },
    
    logResponse: function(response, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'debug';
        }
        log.log(logLevel, () => 
            "formUtil->" + id + "-> Response.headers: " + 
            (response ? log.toMessage(response.headers) : null)
        );
    },

    logEvent: function(event, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'trace';
        }
        log.log(logLevel, () => 
                "formUtil->" + id + "-> Event.target: " + 
                event.target.name + "=" + event.target.value);
    }
};

export default formUtil;