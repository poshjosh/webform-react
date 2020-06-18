'use strict';

// webform-react

import React from "react";
import ReactDOM from "react-dom";
import Form from "./form";

const webform = document.getElementById('webform');

let webform_innerHtml;
if(webform !== null && webform.dataset) {
    webform_innerHtml = <Form {...(webform.dataset)} />;
}else{
    webform_innerHtml = <span id="Webform.formParametersNotSet"/>;
}

ReactDOM.render(webform_innerHtml, webform);    
