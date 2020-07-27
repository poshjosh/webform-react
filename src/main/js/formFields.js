'use strict';

import React from 'react';
import ReactDOM from "react-dom";
import formUtil from "./formUtil";
import formMemberUtil from "./formMemberUtil";
import log from "./log";

const WebformInputClass = {
    FORM_INPUT: "form-input",
    FORM_CHECKBOX: "form-checkbox",
    FORM_SELECT: "form-select",
    FORM_TEXTAREA: "form-textarea"
};

class InputField extends React.Component{
    constructor(props) {
        super(props);
        log.trace("Formfields.InputField#<init>. Props: ", props);
    }
    
    render() {
        const className = WebformInputClass.FORM_INPUT;
        return (
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.props.formMember.type}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.formid}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={formMemberUtil.getValue(this.props)}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                size={formMemberUtil.getSize(this.props.formMember)}
                maxLength={formMemberUtil.getMaxLength(this.props.formMember)}
                />
        );
    }
};

class SelectField extends React.Component{

    /**
     * @param {object} choice - format <code>{"text":"Unactivated","value":0}</code>
     * @returns {string} html generated for the specified choice
     */
    optionHtm(choice) {
        
        const selected = choice.value === this.props.value;

        log.trace(() => "SelectField#listItem. " + 
                this.props.formMember.name + " = " + choice.value + 
                ", selected: " + selected);

        const optionId = formUtil.getIdForSelectOption(this.props.formMember, choice);

//If you add the following property ( selected={selected} ), you get warning:
//Warning: Use the `defaultValue` or `value` props on <select> instead of setting `selected` on <option>.
//            
        const htm = <option 
            ref={optionId}
            id={optionId}
            key={optionId}
            disabled={this.props.disabled}
            name={this.props.formMember.name}
            value={choice.value}>
            {choice.text}
        </option>;

        log.trace("SelectField#listItem. ", htm);        

        return htm;
    }
    
    render() {
        
        const choices = this.props.formMember.choices;
        
        const itemCount = choices.length;

        log.trace("SelectField#render. Choices: ", choices);
        log.trace("SelectField#render. Choices: ", itemCount);
        
        const options = [];

        // choices format = [{"value":0,"text":"Unactivated"},{"value":1,"text":"Activated"}]        
        for(const choice of choices) {
            const htm = this.optionHtm(choice);
            options.push(htm);                 
        }
        
        const className = WebformInputClass.FORM_SELECT;
        
        const noSelection = formUtil.getIdForDefaultSelectOption(this.props.formMember);

        return (
            <select 
                className={className + ' ' + this.props.formMember.type} 
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.formid}
                name={this.props.formMember.name}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                value={formMemberUtil.getValue(this.props)}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}>

                <option ref={noSelection} id={noSelection}>Select {this.props.formMember.label}</option>

                {options}
                
            </select>
        );
    }
};

class CheckBoxField extends React.Component{
    /**
     * We do not set checked manually as this our fields are controlled
     * by React via the defaultValue/value property
     */
    render() {
        const className = WebformInputClass.FORM_CHECKBOX;
        return (                
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.props.formMember.type}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.formid}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                checked={formMemberUtil.isChecked(this.props)}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
            />
        );
    }
};

/*
 * We display file input as text if the form field is disabled 
 */
class FileField extends React.Component{
    isDisabled() {
        return this.props.disabled === true || this.props.disabled === "true" ? true : false;
    }
    render() {
        const className = WebformInputClass.FORM_INPUT;
        return (
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.isDisabled() ? 'text' : 'file'}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.formid}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={formMemberUtil.getValue(this.props)}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                size={formMemberUtil.getSize(this.props.formMember)}
                maxLength={formMemberUtil.getMaxLength(this.props.formMember)}
            />
        );
    }
};

class TextAreaField extends React.Component{
    /**
     * Use the `defaultValue` or `value` props instead of setting children 
     * on the &lt;textarea&gt;
     */
    render() {
        const className = WebformInputClass.FORM_TEXTAREA;
        const numLines = this.props.formMember.numberOfLines;
        const rowCount = numLines > 5 ? 5 : numLines;
        return (
            <textarea className={className + ' ' + this.props.formMember.type} 
                rows={rowCount}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.formid}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={formMemberUtil.getValue(this.props)}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                />
        );
    }
};

export {
    InputField,
    SelectField,
    CheckBoxField,
    FileField,
    TextAreaField
}


