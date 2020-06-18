'use strict';

import log from "./log";

const formUtil = {

    buildTargetPath: function(props, suffix) {
        var target = props.basepath + '/api/' + props.action + '/' + props.modelname;
        if(suffix) {
            target = target + '/' + suffix;
        }
        return target;
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
                    log.debug(() => "Updating FormMember: " + memberName + 
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
        if(source[name]) {
            target[name] = source[name];
        }
    },
    
    collectConfigData: function(formConfig) {
        
        // buffer to collect form config data
        const buffer = {};

        // collect special fields used by the api
        formUtil.updateValue('parentfid', buffer, formConfig);
        formUtil.updateValue('fid', buffer, formConfig);
        formUtil.updateValue('mid', buffer, formConfig);
        formUtil.updateValue('targetOnCompletion', buffer, formConfig);
        formUtil.updateValue('modelfields', buffer, formConfig);
        log.trace("formUtil#collectConfigData. ", buffer);
        
        return buffer;
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