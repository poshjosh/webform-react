'use strict';

// webform-react

import React from "react";
import ReactDOM from "react-dom";
import Form from "./form";

const node = document.getElementById('webform');

let innerHtm;
if(node !== null && node.dataset) {
    innerHtm = <Form {...(node.dataset)} />;
}else{
    innerHtm = <span id="webform-valid-node-not-found"/>;
}

ReactDOM.render(innerHtm, node);    
