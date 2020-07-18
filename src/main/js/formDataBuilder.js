'use strict';

import formUtil from "./formUtil";
import webformStage from "./webformStage";
import log from "./log";

const formDataBuilder = {
    
    newFormDataClientConfig: function(path, entity) {
        const result = {
            method: 'POST', 
            path: path,
            headers: { "Content-Type": "multipart/form-data" },
            entity: entity
        };
        return result;
    },
    
    pathSuffixForFormMember: function(eventName) {
        let suffix;
        if(eventName === "onClick") {
           suffix = webformStage.SubStage.DEPENDENTS;
        }else if(eventName === "onBlur"){
            suffix = webformStage.SubStage.VALIDATE_SINGLE;
        }else{
            suffix = eventName;
        }
        return suffix;
    },

    forFormMember: function(formConfig, name, value) {
        
        const entity = formUtil.collectConfigData(formConfig);
        entity.propertyName = name;
        entity.propertyValue = value;
        entity[name] = value;
        
        log.trace("FormDataBuilder#buildClientConfigForFormMember. data: ", entity);
        
        return entity;
    },
    
    buildHttpConfigForFormMember: function(formConfig, eventName, name, value, props) {
        
        const pathSuffix = formDataBuilder.pathSuffixForFormMember(eventName);
        
        const path = formUtil.buildPathFor(props, formConfig, pathSuffix);
        
        log.trace("FormDataBuilder#buildClientConfigForFormMember. POST ", path);
        
        const entity = formDataBuilder.forFormMember(formConfig, name, value);
        
        return formDataBuilder.newFormDataClientConfig(path, entity);
    },
    
    forForm: function(formConfig, eventName, values) {

        formUtil.logFormConfig(formConfig, eventName);
        
        // buffer to collect form data
        const formData = formUtil.collectConfigData(formConfig);
        
        log.trace("FormDataBuilder#buildFormOutput. Values: ", values);

        // collect form values
        const entity = Object.assign(formData, values);
        
        log.trace("FormDataBuilder#buildFormOutput. Output: ", entity);
        
        return entity;
    },
    
    pathSuffixForForm: function(props, currentFormStage) {
        
        var nextStage = webformStage.next(currentFormStage);
        log.trace(() => "FormDataBuilder#pathSuffixForForm. Current stage: " + 
                currentFormStage + ", Next stage: " + nextStage);
        
        let suffix;
        if(props.express === true || props.express === "true" && nextStage === webformStage.VALIDATE) {
            suffix = webformStage.VALIDATE + '/' + webformStage.SUBMIT;
        }else{
            suffix = webformStage.isFirst(nextStage) ? null : nextStage;
        }   
        
        return suffix;
    },
    
    buildHttpConfigForForm: function(formConfig, eventName, values, currentFormStage, props) {
        
        const pathSuffix = formDataBuilder.pathSuffixForForm(props, currentFormStage);
        
        const path = formUtil.buildPathFor(props, formConfig, pathSuffix);
        
        log.trace("FormDataBuilder#buildClientConfigForFormr. POST ", path);
        
        const entity = formDataBuilder.forForm(formConfig, eventName, values);
     
        return formDataBuilder.newFormDataClientConfig(path, entity);
    }
};

export default formDataBuilder;

