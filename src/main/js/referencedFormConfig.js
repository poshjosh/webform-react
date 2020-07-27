'use strict';

import formUtil from "./formUtil";
import formMemberUtil from "./formMemberUtil";
import log from "./log";

const referencedFormConfig = {
    
    isMultiChoice: function(props) {
        return formMemberUtil.isMultiChoice(props.formMember);
    },
    
    getLink: function(props) {
        // Format of window.location.href = http://website.com/webform/create/Blog
        // Format of window.location.pathname = /webform/create/Blog
        const ref = props.formMember.referencedFormHref;
        // Format of expected output:
        // [apibasepath]/create/blog/?parentfid=form172ceff22f8&targetOnCompletion=/webform/create/post?fid=form172ceff22f8
        const targetOnCompletion = window.location.pathname + '?fid=' + props.form.id;
        const query = '?parentfid=' + props.form.id + 
                      '&targetOnCompletion=' + targetOnCompletion;
        const apiBasePath = formUtil.apibasepath(props);
        log.trace("ReferencedFormConfig#getLink apibasepath: " + apiBasePath);
        const link = ref === null || ref === undefined ? null : 
                formUtil.buildPath(apiBasePath, [props.action, props.formMember.name, query]);
        log.trace("ReferencedFormConfig#getLink: ", link);
        return link;
    },
    
    formMemberHasValue: function(formMember) {
        const value = formMember.value;
        const hasValue = value !== null && value !== "" && value !== undefined;
        return hasValue === true;
    },
    
    /**
     * @param {object} props with keys: form, formMember
     * @returns object of format: 
     * <pre>
     * {
     *     displayField: true,
     *     displayLink: true,
     *     messsage: "Blog is required",
     *     link: {
     *         href: "/api/webform/create/blog/?parentfid=form172ceff22f8&targetOnCompletion=/webform/create/post?fid=form172ceff22f8",
     *         text: "Create one"
     *     }    
     * }
     * </pre>
     */
    buildBaseConfig: function(props) {
        const href = referencedFormConfig.getLink(props);
        const hasLinkToRef = href !== undefined && href !== null;
        const refName = props.formMember.label;
        const multiChoice = referencedFormConfig.isMultiChoice(props);
        
        const message = multiChoice === true ? 
                "Select " + refName + " or " : props.formMember.required ?
                refName + " is required. " : "";
                
        const hasValue = referencedFormConfig.formMemberHasValue(props.formMember);
        
        let linkText;
        if(hasLinkToRef === true) {
            if(hasValue === true) {
                linkText = "Click here to replace " + refName;
            }else{
                linkText = "Click here to add " + refName;
            }
        }else{
            linkText = "";
        }
        
        const displayField = (hasLinkToRef === false || multiChoice === true);
        const displayLink = hasLinkToRef === true;
//        const displayLink = hasLinkToRef === true && (multiChoice === true || hasValue === false);
        const config = {
            displayField: displayField,
            displayLink: displayLink,
            message: message,
            link: {href: href, text: linkText}
        };
        log.trace("ReferencedFormConfig#getConfig: ", config);
        return config;
    },
    
    getConfig: function(props) {
        const baseConfig = referencedFormConfig.buildBaseConfig(props);
        log.trace("ReferencedFormConfig#getConfig baseConfig: ", baseConfig);
        let config;
        if(props.getReferencedFormConfig) {
            config = props.getReferencedFormConfig(props.form, props.formMember, baseConfig);
        }else if(props.getReferencedFormMessage) {
            config = baseConfig;
            config.message = props.getReferencedFormMessage(props.form, props.formMember);
        }else {
            config = baseConfig;
        }
        log.trace("ReferencedFormConfig#getConfig output: ", config);
        return config;
    }
};

export default referencedFormConfig;