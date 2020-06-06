'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const client = require('./client');

const {
    InputField, SelectField, SelectOption, CheckBoxField, FileField, TextAreaField
} = require('./formFields');
const formUtil = require('./formUtil');
const log = require('./log');

log.init({logLevel: 'debug'});

/**
 * The stage signifies what action has been completed. The initial stage is <code>begin</code>.
 * 
 * Each subsequent stage is set just after a successful response is returned 
 * from the api. For example from stage <code>begin</code> we send the form
 * data for validation; on successful return from that request, the stage is 
 * immediately set to <code>validate</code>
 * 
 * @type WebformStage
 */
const WebformStage = {
    
    BEGIN: "begin",
    VALIDATE: "validate",
    SUBMIT: "submit",
    
    first: function() {
        return WebformStage.BEGIN;
    },
    
    isFirst: function(stage) {
        return stage === WebformStage.first();
    },
    
    last: function() {
        return WebformStage.SUBMIT;
    },
    
    isLast: function(stage) {
        return stage === WebformStage.last();
    },

    /**
     * @param {String} stage The stage for which the next stage is returned
     * @returns {String} The stage after the specified stage. If the specified 
     * stage is the last stage, returns the first stage.
     */
    next: function(stage){
        return stage === WebformStage.BEGIN ? WebformStage.VALIDATE :
                stage === WebformStage.VALIDATE ? WebformStage.SUBMIT : 
                WebformStage.BEGIN;
    }
};

/**
 * Supported values for:
 * Form.formMember.type = text, number, password, file, checkbox, radio, datetime-local, date, time, hidden
 * @type type1
 */
class Form extends React.Component {

    constructor(props) {
        super(props);
        log.debug("Form#<init>. Props: ", this.props);
        
        this.state = this.getInitialState();
        
        this.onChange = this.onChange.bind(this);
        this.onClick = this.onClick.bind(this);
        this.onBlur = this.onBlur.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }
    
    getInitialState() {
        return {
            context: {stage: WebformStage.BEGIN},
            formConfig: null,
            values: null,
            messages: { errors: null, infos: null }
        };
    }
    
    updateStates(update) {
        log.trace("Form#updateStates. Update: ", update);
        this.setState(function(state, props) {
            return formUtil.updateObject(state, update);
        });
    }

    updateContext(update) {
        this.updateStates({ context: update });
    }
    
    updateValues(update) {
        this.updateStates({ values: update });
    }
    
    updateFormConfig(update) {
        this.updateStates({ formConfig: update });
    }
    
    onError(response, target, eventName) {
        formUtil.logResponse(response, "Form#onError");
        log.warn(eventName + " error, " + target);
        this.printMessages(response);
        log.trace(response.entity);
    }
    
    printMessages(response) {
        // Sample format of both errors & messages
        // {"0":"The following field(s) have errors","1":"type: must not be null","2":"handle: must not be blank"}
        const errors = response.entity["webform.messages.errors"];
        log.debug("Errors: ", errors);

        const infos = response.entity["webform.messages.infos"];
        log.debug("Infos: ", infos);
        
        const messages = { errors: null, infos: null };
        if(errors) {
            messages.errors = errors;
        }
        if(infos) {
            messages.infos = infos;
        }
        if(messages !== null) {
            this.updateStates( {messages: messages} );
        }
    }
    
    onSuccessInitialLoad(response, target, messages) {
        formUtil.logResponse(response, "Form#onSuccessInitialLoad");
        
        const formConfig = response.entity;

        log.trace("Config: ", formConfig);

        const formMembers = formConfig.form.members;

        // for collecting initial form values
        const initialFormData = {};

//            Did not work. Each formMember when printed = a serial beginning from zero
//            for(const formMember in formMembers) { }

//            formMembers = JSON.parse(JSON.stringify(formConfig.form.members));
//            log.debug("Type of: " + typeof(formMembers)); // object
//            Did not work. Each formMember when printed = a serial beginning from zero
//            for(const formMember in formMembers) { }

        formMembers.forEach((formMember, index) => {
            if(formMember.value !== null) {
                initialFormData[formMember.name] = formMember.value;
            }
        });
        
        if( ! messages) {
            messages = { errors: null, infos: null };
        }

        this.updateStates({
            context: {stage: WebformStage.BEGIN},
            formConfig: formConfig,
            values: initialFormData,
            messages: messages
        });

        formUtil.logFormConfig(formConfig, "Form#onSuccessInitialLoad");
    }
    
    loadInitialData(messagesOnSuccess) {
        const path = formUtil.buildTargetPath(this.props);
        log.debug("Form#loadInitialData. GET ", path);
        client({
            method: 'GET', 
            path: path
        }).done(response => {
            this.onSuccessInitialLoad(response, path, messagesOnSuccess);
        }, response => {
            this.onError(response, path, "loadInitialData");
        });
    }

    componentDidMount() {
        this.loadInitialData();
    }

    buildFormOutput() {

        // buffer to collect form data
        const formData = formUtil.collectConfigData(this.state.formConfig);
        
        const source = this.state.values;
        log.trace("Form#buildFormOutput. Values: ", source);

        // collect form values
        const result = Object.assign(formData, source);
        
        log.debug("Form#buildFormOutput. Output: ", result);
        
        return result;
    }
    
    newFormDataClientConfig(path, entity) {
        const result = {
            method: 'POST', 
            path: path,
            headers: { "Content-Type": "multipart/form-data" },
            entity: entity
        };
        return result;
    }

    /**
     * @param {type} eventName 
     * @param {type} name The name of the formMember that triggered the event
     * @param {type} value The value of the formMember that triggered the event
     * @returns {Form.buildClientConfig.result}
     */
    buildClientConfigForFormMember(eventName, name, value) {
        
        let suffix;
        if(eventName === "onClick") {
           suffix = "dependents";
        }else if(eventName === "onBlur"){
            suffix = "validateSingle";
        }else{
            suffix = eventName;
        }

        const path = formUtil.buildTargetPath(this.props, suffix);
        
        log.debug("Form#buildClientConfigForFormMember. POST ", path);
        
        const entity = formUtil.collectConfigData(this.state.formConfig);
        entity.propertyName = name;
        entity[name] = value;
        
        log.debug("Form#buildClientConfigForFormMember. Submitting: ", entity);
        
        const result = this.newFormDataClientConfig(path, entity);
        
        return result;
    }
    
    /**
     * @param {type} eventName 
     * @returns {undefined}
     */
    buildClientConfigForForm(eventName) {
        const formConfig = this.state.formConfig;
        formUtil.logFormConfig(formConfig, eventName);
        
        const currStage = this.state.context.stage;
        const nextStage = WebformStage.next(currStage);
        
        const suffix = WebformStage.isFirst(nextStage) ? null : nextStage;

        const path = formUtil.buildTargetPath(this.props, suffix);

        log.debug(() => "Form#buildClientConfigForForm. Current stage: " + currStage + 
                ", Next stage: " + nextStage + ", Target: " + path);
        
        const entity = this.buildFormOutput();
        
        const result = this.newFormDataClientConfig(path, entity);
        
        return result;
    }

    /**
     * @param {type} eventName 
     * @param {type} name Optional. The name of the formMember that triggered the event
     * @param {type} value Optional. The value of the formMember that triggered the event
     * @see Form.buildClientConfigForFormMember(eventName, name, value)
     * @see Form.buildClientConfigForForm()
     * @returns {Form.buildClientConfig.result}
     */
    buildClientConfig(eventName, name, value) {
        if(name) {
            return this.buildClientConfigForFormMember(eventName, name, value);
        }else{
            return this.buildClientConfigForForm(eventName);
        }
    }

    handleEvent(event, eventName, formMember) {

        // We don't need preventDefault for onChange etc
        // We particularly need it for onSubmit
        // https://github.com/facebook/react/issues/13477#issuecomment-565609467
        // 
//        event.preventDefault();
        
        formUtil.logEvent(event, eventName);
        
        const eventTarget = event.target;
        // HTML option tags do not contain a name, the name is specified at
        // the parent select tag. However it is the option that receives events
        // So in such cases we extract the name from the formMember
        const name = eventTarget.name ? eventTarget.name : formMember.name;
        
        const value = formMember.type === 'checkbox' || formMember.type === 'radio' ? 
                eventTarget.checked : eventTarget.value;
                
        // onChange event is not sent to the server
        if(eventName === "onChange") {
            
            this.updateValues({ [name]: value });
            
            return;
        }
        
        //@TODO 
        // Remove this abrupt truncation via the return statement
        // Handle async validation via 'validateSingle' api call.
        // Handle async loading of the 'dependents' via dependents api call.
        if(true) {
            return;
        }

        // Other events e.g onClick, onBlur are only sent if we are at first stage
        const firstStage = WebformStage.isFirst(this.state.context.stage);
        if(firstStage !== true) {
            return;
        }
        
        const clientConfig = this.buildClientConfig(eventName, name, value);
        
        client(clientConfig).done(response => {
            
            formUtil.logResponse(response, eventName);
    
            this.printMessages(response);
            
        }, response => {
            
            this.onError(response, clientConfig.path, eventName);
        });
    }

    onChange(formMember, event) {
        this.handleEvent(event, "onChange", formMember);
    }

    onClick(formMember, event) {
        this.handleEvent(event, "onClick", formMember);
    }
    
    onBlur(formMember, event) {
        this.handleEvent(event, "onBlur", formMember);
    }

    nextStage() {
        const currStage = this.state.context.stage;
        var nextStage = WebformStage.next(currStage);
        return nextStage;
    }
    
    isLastStage() {
        const lastStage = WebformStage.isLast(this.nextStage());
        return lastStage;
    }
    
    nextFormConfig(response) {
        // Use existing form config if we are at the last stage
        // This is because, at the last stage, the api does not return a Form
        // object but conforms to REST standards by returning: the domain object 
        // that was either CREATED, READ or UPDATED respectively and for DELETE
        // returning no body but HTTP status.
        const formConfig = this.isLastStage() === true ? 
                this.state.formConfig : response.entity;
        return formConfig;
    }
    
    onSuccessSubmit(response, target) {

        formUtil.logResponse(response, "Form#onSuccessSubmit");
        
        const lastStage = (this.isLastStage() === true);
        
        if(lastStage) {
            
            if(this.props.targetOnCompletion) {
                window.location = this.props.targetOnCompletion;                
            }else{
                this.loadInitialData({ errors: null, infos: {"0": "Success"} });
            }
        }else{
            
            // Move to the first stage, to prepare for form inputs all over agin
            const nextStage = lastStage ? WebformStage.BEGIN : this.nextStage();

            const formConfig = this.nextFormConfig(response);

            this.updateStates({
                context: { stage: nextStage },
                formConfig: formConfig,
                messages: { errors: null, infos: null }
            });

            const form = formConfig.form;
            formUtil.logForm(form, "Form#onSuccessSubmit");
        }
    }
    
    onSubmit(event) {
        event.preventDefault();
        
        const name = "onSubmit";

        const clientConfig = this.buildClientConfig(name);
        
        client(clientConfig).done(response => {
  
            this.onSuccessSubmit(response, clientConfig.path);
            
        }, response => {
            
            this.onError(response, clientConfig.path, name);
        });
    }
    
    isFormDisabled() {
        const stage = this.state.context.stage;
        const form = this.state.formConfig.form;
        const action = form.action;
        const result = (stage === WebformStage.VALIDATE || action === "read");
        log.trace(() =>
                "Form#isFormDisabled " + result + ", State.context: " +
                JSON.stringify(this.state.context));
        return result;
    }

    getFormHeading() {
        const form = this.state.formConfig.form;
        const formName = form.displayName;
        const stage = this.state.context.stage;
        const action = form.action;
        let result;
        if(action === "read") {
            result = "Details for selected " + formName;
        }else if(stage === WebformStage.BEGIN) {
            result = "Enter " + formName + " details";
        }else if(stage === WebformStage.VALIDATE) {
            result = "Confirm " + formName + " entries";
        }else{
            result = formName + " Form";
        }
        return result;
    }

    render() { 
        
        const form = this.state.formConfig !== null ? this.state.formConfig.form : null;
        formUtil.logForm(form, "Form#render");
                
        return (form !== null) && (
            <form>
    
                <h3>{this.getFormHeading()}</h3>
                <FormMessages id="errors" ref="errors" className="error-message" messages={this.state.messages.errors}/>
                <FormMessages id="infos" ref="infos" className="info-message" messages={this.state.messages.infos}/>
                <FormRows form={form} 
                          values={this.state.values} 
                          disabled={this.isFormDisabled()} 
                          onChange={this.onChange}
                          onClick={this.onClick}
                          onBlur={this.onBlur}/>

                <button type="reset" className="button">Reset</button>
                &nbsp;        
                <button type="submit" className="button primary-button" 
                        onClick={this.onSubmit}>Submit</button>
            </form>
        );
    }
};

class FormMessages extends React.Component{
    hasMessages() {
        // this returned either false or the actual value of this.props.messages
//        const hasMessages = this.props.messages !== null && this.props.messages;
        const hasMessages = this.props.messages !== null ? true : this.props.messages ? true : false;
        log.trace("HasMessages: ", hasMessages);
        return hasMessages;
    }
    render() {
        // Sample format
        // {"0":"The following field(s) have errors","1":"type: must not be null","2":"handle: must not be blank"}
        log.trace("Messages: ", this.props.messages);
        const messageRows = this.hasMessages() === false ? null : 
                Object.values(this.props.messages).map((message, index) => 
                <div key={this.props.id + '-'+ index} className={this.props.className}>{message}</div>
        );
        return messageRows === null ? <span></span> : <div className="message-group">{messageRows}</div>;
    }
};

class FormRows extends React.Component{
    getValue(name) {
        return ! this.props.values ? '' : 
               ! this.props.values[name] ? '' : this.props.values[name];
    }
    render() {
        const formRows = this.props.form.nonHiddenMembers.map(formMember =>
            <FormRow key={formMember.id + '-row'} 
                     ref={formMember.id + '-row'}   
                     form={this.props.form} 
                     formMember={formMember} 
                     value={this.getValue(formMember.name)}
                     disabled={this.props.disabled}
                     onChange={this.props.onChange}
                     onClick={this.props.onClick}
                     onBlur={this.props.onBlur}/>
        );
        
        return (formRows);
    }
};

class FormRow extends React.Component{
    render() {
        
        log.trace("FormRow#render. Value: ", this.props.value);
        
        let formField;
        
        if(this.props.formMember.multiChoice) {
            formField = (<SelectField form={this.props.form}
                                      formMember={this.props.formMember}
                                      value={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else if(this.props.formMember.type === 'checkbox') {
            formField = (<CheckBoxField form={this.props.form}
                                      formMember={this.props.formMember}
                                      value={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else if(this.props.formMember.type === 'file') {
            formField = (<FileField form={this.props.form}
                                      formMember={this.props.formMember}
                                      value={this.props.value}
                                      disabled={this.props.disabled}
                                      onChange={this.props.onChange}
                                      onClick={this.props.onClick}
                                      onBlur={this.props.onBlur}/>);
        }else{
            if(this.props.formMember.numberOfLines < 2) {
                formField = (<InputField form={this.props.form}
                                          formMember={this.props.formMember}
                                          value={this.props.value}
                                          disabled={this.props.disabled}
                                          onChange={this.props.onChange}
                                          onClick={this.props.onClick}
                                          onBlur={this.props.onBlur}/>);
            }else{
                formField = (<TextAreaField form={this.props.form}
                                          formMember={this.props.formMember}
                                          value={this.props.value}
                                          disabled={this.props.disabled}
                                          onChange={this.props.onChange}
                                          onClick={this.props.onClick}
                                          onBlur={this.props.onBlur}/>);
            }
        }
        
        const refFormHref = this.props.formMember.referencedFormHref;
        const refName = this.props.formMember.label;
        const multiChoice = this.props.formMember.multichoice;
        const msgPrefix = multiChoice === true ? 
                "Select " + refName + " or " :
                refName + " is required. ";
        const refFormMsg = refFormHref !== null ? "Create one" : "";
        const displayMember = refFormHref === null ? true : multiChoice;
        
        return (
            <div className="form-row">
                <FieldHeading formMember={this.props.formMember}/>

                {(this.props.formMember.type === 'checkbox') && (' ') || (<br/>)}

                {displayMember && formField}
                
                {(refFormHref !== null) && (
                        <span>{msgPrefix}
                            <a href={refFormHref} target="_blank">{refFormMsg}</a>
                        </span>
                    )
                }
            </div>    
        );
    }
};

class FieldHeading extends React.Component{
    render(){
        return (this.props.formMember.type !== 'hidden') && (
            <span className="nowrap">
                <label className="nowrap" htmlFor={this.props.formMember.id}>
                    {this.props.formMember.label}
                </label>

                <MandatoryFieldTag show={this.props.formMember.required}/>
                
                <FieldAdvice formMember={this.props.formMember}/>
            </span>
        );
    }
};

class MandatoryFieldTag extends React.Component{
    render(){
        return (this.props.show === true) && (
            <font className="red heavy-max"> * </font>
        );
    }
};

class FieldAdvice extends React.Component{
    render(){
        return (this.props.formMember.advice) && (
            <span className="formFieldMessage" id={this.props.formMember.id + '-message'}>
                &emsp;({this.props.formMember.advice})
            </span>
        );
    }
};

export default Form;
    
