'use strict';

import log from './log';

const formMemberUtil = {
    
    hasValue: function(arg) {
        return arg !== null && arg !== undefined;
    },
    
    /**
     * Get the FormMember.dataType property
     * 
     * Formats <code>com.domain.Blog</code> to <code>Blog</code>
     * 
     * @param {type} formMember
     * @param {type} resultIfNone
     * @returns The data type or resultIfNone
     */
    getDataType: function(formMember, resultIfNone) {
        var result;
        const dataType = formMember.dataType;
        log.trace("FormMemberUtil#getDataType dataType: " + dataType);
        if(dataType !== null && dataType !== undefined) {
            dataType = dataType.toString();
            const offset = dataType.lastIndexOf(".");
            if(offset !== -1) {
                result = dataType.substring(offset + 1, dataType.length);
            }
        }
        var output = result ? result : resultIfNone;
        if(output) {
            output = output.toString();
        }
        return output;
    },
    
    addNewlyCreated: function(response, formConfig) {
        var formMember = formMemberUtil.addNewlyCreatedUsingResponseEntity(response, formConfig);
        if(formMember === null || formMember === undefined) {
            formMember = formMemberUtil.addNewlyCreatedUsingResponseHeaders(response, formConfig);
        }
        if(formMember !== null && formMember !== undefined) {
            log.debug(() => "FormMemberUtil#addNewlyCreated set " + 
                    formConfig.form.name + "#" + formMember.name + " = " + formMember.value);
        }
        return formMember;
    },

    addNewlyCreatedUsingResponseEntity: function(response, formConfig) {
        const responseFormConfig = response.entity;
        var updatedMember;
        if(responseFormConfig && responseFormConfig.form && 
                responseFormConfig.form.dataSource && responseFormConfig.form.dataSource.id) {
            const targetMemberName = responseFormConfig.modelname;
            formConfig.form.members.forEach((formMember, index) => {
//                const dt = formMemberUtil.getDataType(formMember);
                if(formMember.name === targetMemberName) {
                    formMember.value = responseFormConfig.form.dataSource.id;
                    updatedMember = formMember;
                }
            });
        }
        return updatedMember;
    },

    /**
     * Update the appropriate form member with the value gotten from the newly 
     * created entity.
     * 
     * This works with REST standard responses
     * 
     * This method makes use of the {XMLHttpRequest.response.headers.Location}
     * property to determine which form member to update and also the id of the
     * newly created. The value of the form member selected for update is 
     * set to the value of the id of the newly created entity.
     * 
     * @param {XMLHttpRequest.response} response
     * @param {Form.formConfig} formConfig
     * @returns {object} The updated FormMember or <code>null</code>
     */
    addNewlyCreatedUsingResponseHeaders: function(response, formConfig) {
        var updatedMember;
        log.trace("FormMemberUtil#addNewlyCreated ", response.entity);
        if(response.entity && formConfig.form.members) {
            //Format:  {"Location":"http://localhost:9010/read/blog/1"}
            const loc = response.headers['Location'];
            log.trace("FormMemberUtil#addNewlyCreated Response.headers.Location: ", loc);
            if(loc) {
                formConfig.form.members.forEach((formMember, index) => {
                    const memberKeys = [formMember.name, formMember.name.toLowerCase()];
                    var pos = -1;
                    for(const elem of memberKeys) {
                        tgt = "/" + elem + "/";
                        pos = loc.indexOf(tgt);
                        if(pos !== -1) {
                            break;
                        }
                    }
                    if(pos !== -1) {
                        const idString = loc.substring(pos + tgt.length, loc.length);
                        const id = parseInt(idString, 10);
                        formMember.value = id;
                        updatedMember = formMember;
                    }
                });
            }
        }
        return updatedMember;
    },

    getValue: function(props, resultIfNone = "") {
        return formMemberUtil.hasValue(props.value) ? props.value : resultIfNone;
    },

    getSize: function(props, resultIfNone = 35) {
        return formMemberUtil.getNumberProperty(props, "size", resultIfNone);
    },
    
    getMaxLength: function(props, resultIfNone = 100) {
        return formMemberUtil.getNumberProperty(props, "maxlength", resultIfNone);
    },

    getNumberProperty: function(props, name, resultIfNone = 35) {
        const value = props[name];
        if(formMemberUtil.hasValue(value)) {
            if(typeof value === 'number') {
                return value;
            }else{
                return parseInt(value.toString(), 10);
            }
        }else{
            return resultIfNone;
        }
    },
    
    isChecked: function(props, resultIfNone = false) {
        return formMemberUtil.getBooleanProperty(props, "checked", resultIfNone);
    },

    getBooleanProperty: function(props, name, resultIfNone = false) {
        const value = props[name];
        if(formMemberUtil.hasValue(value)) {
            if(typeof value === 'boolean') {
                return value;
            }else{
                return value === 'true';
            }
        }else{
            return resultIfNone;
        }
    }
};

export default formMemberUtil;