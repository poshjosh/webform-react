'use strict';

import React from "react";
import ReactDOM from "react-dom";
import FieldHeading from "./formFieldHeading";
import {
    InputField, SelectField, CheckBoxField, FileField, TextAreaField
} from "./formFields";
import formUtil from "./formUtil";
import referencedFormConfig from "./referencedFormConfig";
import log from "./log";

/**
 * @type FormRow
 */
class FormRow extends React.Component{
    
    constructor(props) {
        super(props);
        log.trace("FormRow#<init>. Props: ", props);
        this.state = {multiChoice : this.isMultiChoice()};
    }
    
    isMultiChoice() {
        const multiChoice = this.props.formMember.multiChoice;
        return multiChoice === true || multiChoice === 'true';
    }
    
    /**
     * FormMember.multiChoice is updated from <code>false</code> to <code>true</code>
     * after the multi-choice of a dependent formMember are newly loaded from 
     * the API. This is the case for so-called dependent componetns. For example
     * Selecting a country provides a context for populating the region options.
     * We thus say the region option is dependent on the country option.
     * @returns {Boolean}
     */
    isMultiChoicePropertyUpdated() {
        return ! this.state.multiChoice && this.isMultiChoice();
    }
    
    shouldComponentUpdate() {
        if(this.isMultiChoicePropertyUpdated()) {
            return true;
        }
        // This is the default return value
        return true;
    }
    
    getFormField() {
        
        log.trace("FormRow#getFormField props.formMember: ", this.props.formMember);
        
        let formField;
        
        if(this.isMultiChoice()) {
            formField = (<SelectField formid={this.props.form.id}
                                      formMember={this.props.formMember}
                                      value={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else if(this.props.formMember.type === 'checkbox') {
            formField = (<CheckBoxField formid={this.props.form.id}
                                      formMember={this.props.formMember}
                                      checked={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else if(this.props.formMember.type === 'file') {
            formField = (<FileField formid={this.props.form.id}
                                      formMember={this.props.formMember}
                                      value={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else{
            if(this.props.formMember.numberOfLines < 2) {
                formField = (<InputField formid={this.props.form.id}
                                         formMember={this.props.formMember}
                                         value={this.props.value}
                                         disabled={this.props.disabled}
                                         onChange={this.props.onChange}
                                         onClick={this.props.onClick}
                                         onBlur={this.props.onBlur}/>);
            }else{
                formField = (<TextAreaField formid={this.props.form.id}
                                          formMember={this.props.formMember}
                                          value={this.props.value}
                                          disabled={this.props.disabled}
                                          onChange={this.props.onChange}
                                          onClick={this.props.onClick}
                                          onBlur={this.props.onBlur}/>);
            }
        }
        
        return formField;
    }
    
    render() {

        const multiChoice = this.isMultiChoice();
        const choices = this.props.formMember.choices;
        
        log.trace(() => "FormRow#render. Type: " + this.props.formMember.type + 
                ", MultiChoice: " + multiChoice +
                ", Name: " + this.props.formMember.name + 
                ", Value: " + this.props.value + ", choices: " +
                (choices ? Object.keys(choices).length : null));
        
        const config = referencedFormConfig.getConfig(this.props);
        
        const fieldMessageId = formUtil.getIdForFormFieldMessage(this.props.formMember);
        
        const errorProp = this.props.errors;
        const errorArray = typeof(errorProp) === 'object' ? Object.values(errorProp) : errorProp;
        const hasErrors = (errorArray !== null && errorArray !== undefined && errorArray.length > 0);
        const errorHtm = hasErrors === false ? null : errorArray
                .map((error, index) => {
                    if(error.fieldName) {
                        const id = fieldMessageId + "-" + index;
                        return <div key={id} id={id}>
                            {"Invalid '" + error.fieldName + "': " + error.message}
                            </div>;
                    }else{
                        return <div key={id} id={id}>{"Error: " + error.message}</div>;
                    }
                }    
        );

        log.trace("FormRow#render has errors: " + hasErrors + ", errors: ", errorHtm);

        return (
            <div className="form-row" key={"form-row-" + this.props.formMember.id}>
    
                {(hasErrors === true && 
                        <div className="error-message" id={fieldMessageId}>{errorHtm}</div>)}
                
                <FieldHeading formMember={this.props.formMember}/>

                {(this.props.formMember.type === 'checkbox') && (' ') || (<br/>)}

                {config.displayField === true && this.getFormField()}
                
                {config.displayLink && (
                        <tt>{config.message}
                            <a href="#" target="_blank"
                               onClick={(e) => this.props.onBeginReferencedForm(e, config.link.href)}>
                               {config.link.text}
                             </a>
                        </tt>
                    )
                }
            </div>    
        );
    }
};

export default FormRow;
    
