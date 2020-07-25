'use strict'

import React, { useCallback } from "react";
import ReactDOM from "react-dom";
import log from "./log";

const countFieldErrors = (errors) => {
    var count = 0;
    errors.forEach((error, index) => {
        if(error.fieldName !== null && error.fieldName !== undefined && error.fieldName !== "") {
            count = count + 1;
        }
    });
    return count;
};

const buildErrorTitle = (errors) => {
    let title;
    if(errors && errors.length > 0) {

        const fieldErrorCount = countFieldErrors(errors);

        if(fieldErrorCount > 0) {
            if(fieldErrorCount === 1) {
                title = "Please review one error below";
            }else {
                title = "Please review " + fieldErrorCount + " errors below";
            }
        }else{ // Only object level errors
            title = "An unexpected error occured";
        }
    }else{ // No errors
        title = null;
    }
    return title;
};

/**
 * Use to display above the form, a title describing form errors/infos.
 * 
 * @param {object) props - format: <code>{errors:[], className:"string"}</code>
 * 
 * @returns {HTML}
 */
const TitleOfMessagesAutoFocused = (props) => {
    
    const callbackRef = useCallback(messageElement => {
        if (messageElement) {
            log.debug("TitleOfMessagesAutoFocused focusing");
            messageElement.focus();
        }
    }, []);
  
    const errorTitle = buildErrorTitle(props.errors);

    const errorHtm = errorTitle === null ? null : 
            <div autoFocus ref={callbackRef} className={props.className}>{errorTitle}</div>;

    return (errorHtm);
};

export default TitleOfMessagesAutoFocused;