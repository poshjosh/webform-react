'use strict';

import React from "react";
import ReactDOM from "react-dom";
import formUtil from "./formUtil";

class FieldHeading extends React.Component{
    headingHtm() {
        return <span className="nowrap">
            <label className="nowrap" htmlFor={this.props.formMember.id}>
                {this.props.formMember.label}
            </label>

            {(this.props.formMember.required &&
                    <font className="red heavy-max"> * </font>)}

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

class FieldAdvice extends React.Component{
    render(){
        const fieldAdviceId = formUtil.getIdForFormFieldAdvice(this.props.formMember);
        let htm;
        if(this.props.formMember.advice) {
            htm = <span className="formFieldAdvice" id={fieldAdviceId}>
                &emsp;({this.props.formMember.advice})
            </span>;
        }else{
            htm = <span className="formFieldAdvice" id={fieldAdviceId}/>;
        }
        return (htm);
    }
};

export default FieldHeading;
    
