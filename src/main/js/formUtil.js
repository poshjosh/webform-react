'use strict';

import queryString from "query-string";
import errors from "./errors";
import log from "./log";

const formUtil = {
    
    getSearchProperty: function(props) {
        let search;
        if(props.search) {
            if(props.search.indexOf('?') === 0) {
                search = props.search.substring(1, props.search.length);
            }else{
                search = props.search;
            }
        }
        return search;
    },

    addSearchPropertyIfPresent: function(props, path) {
        const search = formUtil.getSearchProperty(props);
        if(search) {
            const separator = path.indexOf('?') === -1 ? '?' : '&';
            const update = path + separator + search;
            log.debug("Form#addReturnToIfPresent Added `return_to` to path. Updated:\nfrom: " + path + "\n  To: " + update);
            return update;
        }else{
            return path;
        }
    },
    
    addReturnToIfSpecified: function(props, path) {
        if(props.returnHere === true || props.returnHere === "true") {
            const separator = path.indexOf('?') === -1 ? '?' : '&';
            const update = path + separator + "targetOnCompletion=" + window.location.pathname;
            log.debug("FormUtil#addReturnToIfSpecified Added `return_to` to path. Updated:\nfrom: " + 
                    path + "\n  To: " + update);
            return update;
        }
        return path;
    },
    
    basepath: function(props) {
        return props.basepath ? props.basepath : "";
    },
    
    apibasepath: function(props) {
        return props.apibasepath ? props.apibasepath : "";
    },

    /**
     * Check if the form id of both arguments match and return <code>true</code> 
     * if they match. Otherwise return <code>false</code>.
     * 
     * Parse the query part of <code>path</code> and check if the <code>fid</code> 
     * parameter is equal to the <code>fid</code> property of the 
     * <code>formConfig</code> If both are equal, return <code>true</code> 
     * otherwise return <code>false</code>
     * 
     * @param {object} formConfig
     * @param {string} path
     * @returns {boolean} true if the form id extracted form both arguments
     * are equal.
     */
    hasMatchingFormId: function(formConfig, path) {
        var result = false;
        if(path !== null && path !== undefined
                && formConfig !== null && formConfig !== undefined) {
            const pos = path.indexOf("?");
            if(pos !== -1) {
                const len = path.length;
                const query = path.substring(pos, len);
                const parsed = queryString.parse(query);
                if(parsed.fid === formConfig.fid) {
                    result = true;
                }
            }
        }
        return result;
    },
    
    buildPath: function(basepath, paths = []) {
        var result = errors.requireValue("FormUtil#buildPath(basepath,", basepath);
        for(const path of paths) {
            if(path !== null && path !== undefined) {
                result = result + "/" + path;
            }
        }
        log.trace("FormUtil#buildPath Output: " + result);
        return result;
    },
    
    buildPathFor: function(props, formConfig, suffix) {
        const action = formConfig ? formConfig.action : props.action;
        const modelname = formConfig ? formConfig.modelname : props.modelname;
        var modelid = formConfig ? formConfig.id : props.id;
        if( ! modelid) {
            modelid = formConfig ? formConfig.mid : props.mid;
        }
        
        if(modelid) {
            if(suffix) {
                const conn = suffix.indexOf("?") === -1 ? "?" : "&";
                suffix = suffix + conn + "id=" + modelid;
                modelid = null;
            }else{
                modelid = "?id=" + modelid;
            }
        }
        
        const path = [action, modelname, modelid, suffix];
        const apibasepath = formUtil.apibasepath(props);
        const result = formUtil.buildPath(apibasepath, path);
        log.trace("FormUtil#buildPathFor Output: " + result);
        return result;
    },

    updateMultiChoice(formConfig, formMember, choiceMappings) {
        
        log.trace(() => "Updating Form." + formMember.name + 
                " with: " + log.toMessage(choiceMappings));
        
        // FormMember format 
        // {"id":"country","name":"country","label":"Country","advice":null,
        //  "value":null,"choices":[{"text":"Unactivated","value":0},{"text":"Activated","value":1}],"maxLength":-1,"size":35,
        //  "numberOfLines":1,"type":"text","referencedFormHref":null,
        //  "referencedForm":null,"optional":false,"multiChoice":true,
        //  "multiple":false,"displayName":"Country","required":true,
        //  "anyFieldSet":true,"formReference":false}
        const formMembersUpdate = formConfig.form.members.map((member, index) => {
            for(const key in choiceMappings) {
                const memberName = member['name'];
                if(memberName === key) {
                    // choices format = [{"text":"Unactivated","value":0},{"text":"Activated","value":1}]
                    const choices = choiceMappings[key];
                    log.trace(() => "Updating FormMember: " + memberName + 
                            " with choices: " + log.toMessage(choices));
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
        
        log.trace("FormUtil#collectFormData ", collectInto);
        
        return collectInto;
    },
    
    collectConfigData: function(formConfig, collectInto = {}) {
        
        //@related(FormConfig.fields) to back-end api
        // collect special fields used by the api
        formUtil.updateValue('parentfid', collectInto, formConfig);
        formUtil.updateValue('fid', collectInto, formConfig);
        formUtil.updateValue('id', collectInto, formConfig);
        formUtil.updateValue('targetOnCompletion', collectInto, formConfig);
        formUtil.updateValue('modelfields', collectInto, formConfig);
        formUtil.updateValue('uploadedFiles', collectInto, formConfig);
//        formUtil.updateValue('stage', collectInto, formConfig);
        log.trace("formUtil#collectConfigData. ", collectInto);
        
        return collectInto;
    },
    
    getIdForFormFieldAdvice: function(formMember) {
        return formMember.id + '-advice';
    },
    
    getIdForFormFieldMessage: function(formMember) {
        return formMember.id + '-message';
    },

    getIdForSelectOption: function(formMember, option) {
        errors.requireValue("formMember", formMember);
        errors.requireValue("index", option.value);
        return formMember.id + '-' + option.value;
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
    
    logForm: function(form, id, logLevel = "trace") {
        log.log(logLevel, () => 
            "formUtil->" + id + 
            "-> Form. name: " + (form ? form.name : null) + 
            ", members: " + (form ? form.memberNames : null)
        );
    },
    
    logResponse: function(response, id, logLevel = "trace") {
        log.log(logLevel, () => 
            "formUtil->" + id + "-> Response.headers: " + 
            (response ? log.toMessage(response.headers) : null)
        );
    },

    logEvent: function(event, id, logLevel = "trace") {
        log.log(logLevel, () => 
                "formUtil->" + id + "-> Event.target: " + 
                event.target.name + "=" + event.target.value);
    }
};

export default formUtil;