'use strict';

import React from "react";
import ReactDOM from "react-dom";

class FieldHeading extends React.Component{
    headingHtm() {
        return <span className="nowrap">
            <label className="nowrap" htmlFor={this.props.formMember.id}>
                {this.props.formMember.label}
            </label>

            <MandatoryFieldTag show={this.props.formMember.required}/>

            <FieldAdvice formMember={this.props.formMember}/>
        </span>;
    }
    render(){
        let htm;
        if(this.props.formMember.type !== 'hidden') {
            htm = this.headingHtm();
        }else{
            htm = null;
        }
        return (htm);
    }
};

class MandatoryFieldTag extends React.Component{
    render(){
        let htm;
        if(this.props.show === true) {
            htm = <font className="red heavy-max"> * </font>;
        }else{
            htm = null;
        }
        return (htm);
    }
};

class FieldAdvice extends React.Component{
    render(){
        const id = this.props.formMember.id + '-message';
        let htm;
        if(this.props.formMember.advice) {
            htm = <span className="formFieldMessage" id={id}>
                &emsp;({this.props.formMember.advice})
            </span>;
        }else{
            htm = <span className="formFieldMessage" id={id}/>;
        }
        return (htm);
    }
};

export default FieldHeading;
    
