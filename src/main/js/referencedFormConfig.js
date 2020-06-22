'use strict';

import formUtil from "./formUtil";
import log from "./log";

const referencedFormConfig = {
    
    isMultiChoice: function(props) {
        const multiChoice = props.formMember.multiChoice;
        return multiChoice === true || multiChoice === 'true';
    },
    
    getLink: function(props) {
        // Format of window.location.href = http://website.com/webform/create/Blog
        // Format of window.location.pathname = /webform/create/Blog
        const ref = props.formMember.referencedFormHref;
        // Format of expected output:
        // [apibasepath]/create/blog/?parentfid=form172ceff22f8&targetOnCompletion=/webform/create/post?fid=form172ceff22f8
        const link = ref === null || ref === undefined ? null : 
                formUtil.buildTargetPathForModel(
                    props.apibasepath, props.action, props.formMember.name, 
                    '?parentfid=' + props.form.id + 
                    '&targetOnCompletion=' + window.location.pathname + 
                    '?fid=' + props.form.id);
        log.trace("ReferencedFormConfig#getLink: ", link);
        return link;
    },
    
    /**
     * @param {object} props with keys: form, formMember
     * @returns object of format: 
     * <pre>
     * {
     *     displayField: [true|false],
     *     displayLink: [true|false],
     *     link: string,
     *     message: {
     *         prefix: string,
     *         value: string
     *     }
     * }
     * </pre>
     */
    getConfig: function(props) {
        const linkToRef = referencedFormConfig.getLink(props);
        const hasLinkToRef = linkToRef !== undefined && linkToRef !== null;
        const refName = props.formMember.label;
        const multiChoice = referencedFormConfig.isMultiChoice(props);
        const msgPrefix = multiChoice === true ? 
                "Select " + refName + " or " : props.formMember.required ?
                refName + " is required. " : "";
        const refFormMsg = hasLinkToRef ? "Create one" : "";
        const displayField = (hasLinkToRef === false || multiChoice === true);
        const value = props.formMember.value;
        const hasValue = value !== null && value !== "" && value !== undefined;
        const displayLinkToRef = hasLinkToRef === true && 
                (multiChoice === true || hasValue === false);
        const config = {
            displayField: displayField,
            displayLink: displayLinkToRef,
            link: linkToRef,
            message: {
                prefix: msgPrefix,
                value: refFormMsg
            }
        };
        log.trace("ReferencedFormConfig#getConfig: ", config);
        return config;
    }
};

export default referencedFormConfig;