'use strict';

import React from "react";
import ReactDOM from "react-dom";
import queryString from "query-string";
import client from "./client";
import FieldHeading from "./formFieldHeading";
import {
    InputField, SelectField, CheckBoxField, FileField, TextAreaField
} from "./formFields";
import formUtil from "./formUtil";
import webformStage from "./webformStage";
import referencedFormConfig from "./referencedFormConfig";
import log from "./log";
log.init({logLevel: 'debug'});

/**
 * Required props are: 
 * <ul>
 *   <li>basepath - The path to the api without the domain e.g <code>/api</code></li>
 *   <li>action - One of: [create|read|update|delete]</li>
 *   <li>modelname - The name of the model for which a form will be displayed</li>
 * </ul>
 * Optional props are: 
 * <ul>
 *   <li>
 *       asyncvalidation - If true validation will be done for each input as
 *       a value is entered.
 *   </li>
 * </ul>
 * 
 * <b>Note</b> action and modelname may change from the original reflected in
 * the props. To use the current values of those properties access them via
 * the <code>this.state.formConfig</code>
 * 
 * Supported values for:
 * Form.formMember.type = text, number, password, file, checkbox, radio, datetime-local, date, time, hidden
 * 
 * @type Form
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
        this.onBeginReferencedForm = this.onBeginReferencedForm.bind(this);
    }
    
    // pendingFormConfig is used to offload the current formConfig if we have
    // to divert/take a tangential action via another form. This way when we
    // return we can continue from where we stopped by loading the pendingFormConfig
    //
    getInitialState() {
        return {
            context: {stage: webformStage.BEGIN},
            formConfig: null,
            pendingFormConfig: null,
            values: null,
            messages: { errors: null, infos: null }
        };
    }
    
    /**
     * @param {object} update The new state
     * @param {boolean} replace if state values should be entirely replaced or updated
     * @returns {undefined}
     */
    updateStates(update, replace = false) {
        log.trace("Form#updateStates. Update: ", update);
        this.setState(function(state, props) {
            if(replace) {
                return update;
            }else{
                return formUtil.updateObject(state, update);
            }
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
    
    onError(response, path) {
        formUtil.logResponse(response, "Form#onError");
        this.printMessages(response);
    }
    
    printMessages(response) {
        // Sample format of both errors & messages
        // {"0":"The following field(s) have errors","1":"type: must not be null","2":"handle: must not be blank"}
        const errors = response.entity["webform.messages.errors"];

        const infos = response.entity["webform.messages.infos"];
        
        const messages = { errors: null, infos: null };
        if(errors) {
            log.debug("Errors: ", errors);
            messages.errors = errors;
        }
        if(infos) {
            log.debug("Infos: ", infos);
            messages.infos = infos;
        }
        if(messages !== null) {
            this.updateStates( {messages: messages}, true );
        }
    }
    
    getRefreshedState(formConfig, formValues, messages) {
        
        if( ! messages) {
            messages = { errors: null, infos: null };
        }

        const result = {
            context: {stage: webformStage.BEGIN},
            formConfig: formConfig,
            values: formValues,
            messages: messages
        };
        
        return result;
    }
    
    refreshStates(formConfig, formValues, messages) {
        
        formUtil.logFormConfig(formConfig, "Form#refreshStates");
        log.trace("Form#refreshStates FormValues: ", formValues);
        
        const stateUpdate = this.getRefreshedState(formConfig, formValues, messages);
        
        this.updateStates(stateUpdate);
    }
    
    onSuccessInitialLoad(response, path, messages) {
        formUtil.logResponse(response, "Form#onSuccessInitialLoad");
        
        const formConfig = response.entity;
        
        const formValues = formUtil.collectFormData(formConfig);
        
        this.refreshStates(formConfig, formValues, messages);
    }
    
    getRequest(path, onSuccess, onError) {
        if( ! onError) {
            onError = (response) => this.onError(response, path);
        }
        const clientConfig = { method: 'GET', path: path };
        
        log.debug("Form#getRequest, submitting: " + clientConfig.path);
        
        client(clientConfig).done(response => {
            log.trace("Form#getRequest success: " + path);
            onSuccess(response);
        }, response => {
            log.debug("Form#getRequest error: " + path);
            onError(response);
        });
    }

    getInitialData(path, messagesOnSuccess) {
        log.trace("Form#getInitialData. GET ", path);
        this.getRequest(path,
            (response) => this.onSuccessInitialLoad(response, path, messagesOnSuccess),
            (response) => this.onError(response, path));
    }
    
    buildDefaultPath(formConfig = this.state.formConfig) {
        const action = formConfig ? formConfig.action : this.props.action;
        const modelname = formConfig ? formConfig.modelname : this.props.modelname;
        return formUtil.buildTargetPathForModel(
                this.props.basepath, action, modelname);
    }
    
    loadInitialData(messagesOnSuccess) {
        const path = this.buildDefaultPath();
        this.getInitialData(path, messagesOnSuccess);
    }
    
    onBeginReferencedForm(event, path) {
        
        event.preventDefault();
        
        log.trace("Form#onBeginReferencedForm, path: ", path);

        // This kind of transition requires replacing the entire
        // FormConfig with the update.
        //
        const replaceEntirely = true;
        this.updateStates({ pendingFormConfig: this.state.formConfig }, replaceEntirely);
        
        this.getInitialData(path);
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
        
        log.trace("Form#buildFormOutput. Output: ", result);
        
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
           suffix = webformStage.SubStage.DEPENDENTS;
        }else if(eventName === "onBlur"){
            suffix = webformStage.SubStage.VALIDATE_SINGLE;
        }else{
            suffix = eventName;
        }
        
        const formConfig = this.state.formConfig;

        const path = formUtil.buildTargetPath(this.props, formConfig, suffix);
        
        log.trace("Form#buildClientConfigForFormMember. POST ", path);
        
        const entity = formUtil.collectConfigData(formConfig);
        entity.propertyName = name;
        entity.propertyValue = value;
        entity[name] = value;
        
        log.trace("Form#buildClientConfigForFormMember. data: ", entity);
        
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
        const nextStage = webformStage.next(currStage);
        
        const suffix = webformStage.isFirst(nextStage) ? null : nextStage;

        const path = formUtil.buildTargetPath(this.props, formConfig, suffix);

        log.trace(() => "Form#buildClientConfigForForm. Current stage: " + currStage + 
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
    
    getEventTargetValue(event, formMember) {
        const eventTarget = event.target;
        return formMember.type === 'checkbox' || formMember.type === 'radio' ? 
                eventTarget.checked : eventTarget.value;
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
        
        const value = this.getEventTargetValue(event, formMember);
                
        log.trace(() => eventName + " " + name + " = " + value);        
        
        // onChange event is not sent to the server
        if(eventName === "onChange") {
            
            this.updateValues({ [name]: value });
            
            return;
        }
        
        // Other events e.g onClick, onBlur are only sent if we are at first stage
        const firstStage = webformStage.isFirst(this.state.context.stage);
        if(firstStage !== true) {
            return;
        }
        
        const clientConfig = this.buildClientConfig(eventName, name, value);
        
        log.debug("Form#handleEvent, submitting: " + 
                clientConfig.path + "\n", clientConfig);
        
        client(clientConfig).done(response => {
            
            formUtil.logResponse(response, eventName);
            
            if("onClick" === eventName) {
                
                const choices = response.entity;
                
                const formConfig = formUtil.updateMultiChoice(
                        this.state.formConfig, formMember, choices);
                
                this.updateFormConfig(formConfig);
                
            }else{
    
                this.printMessages(response);
            }
            
        }, response => {
            
            this.onError(response, clientConfig.path);
        });
    }

    isEventAccepted(event, formMember) {
        let accepted;
        if(formMember.multiChoice) {
            const targetValue = this.getEventTargetValue(event, formMember);
            if(targetValue !== null && targetValue !== undefined) {

                const idNoSelection = formUtil.getIdForDefaultSelectOption(formMember);
                const noSelection = document.getElementById(idNoSelection).value;
                
                accepted = targetValue !== noSelection;
                
                log.trace(() => "Form#isEventAccepted accepted: " + accepted 
                        + ", target.value: " + targetValue + 
                        ", default slection: " + noSelection);
                
        // Default select has value Select [name] ... Value is of type String
        // Other selections each have value of type number
        //
//                const value = parseInt(targetValue, 10);
//                accepted = ! isNaN(value);
            }else{
                accepted = formMember.choices ? true : false;
            }
        }else{
            accepted = true;
        }
        log.trace("Form#isEventAccepted. accepted: " + 
                accepted + ", FormMember: " + formMember.name);
        return accepted;
    }

    onChange(formMember, event) {
        if(this.isEventAccepted(event, formMember)) {
            this.handleEvent(event, "onChange", formMember);
        }
    }
    
    onClick(formMember, event) {
        if(this.isEventAccepted(event, formMember)) {
            const value = this.getEventTargetValue(event, formMember);
            if(value !== null && value !== "" && value !== undefined) {
                this.handleEvent(event, "onClick", formMember);
            }
        }
    }
    
    onBlur(formMember, event) {
        if(this.props.asyncvalidation === true || this.props.asyncvalidation === 'true') {
            if(this.isEventAccepted(event, formMember)) {
                this.handleEvent(event, "onBlur", formMember);
            }
        }
    }

    nextStage() {
        const currStage = this.state.context.stage;
        var nextStage = webformStage.next(currStage);
        return nextStage;
    }
    
    isLastStage() {
        const lastStage = webformStage.isLast(this.nextStage());
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
    
    /**
     * Return {Form.state.pendingFormConfig} if it matches the formid paramter
     * of {Form.state.formConfig.targetOnCompletion}.
     * 
     * Parse the query part of {Form.state.formConfig.targetOnCompletion} and 
     * check if the <code>fid</code> parameter is equal to the <code>fid</code> 
     * property of {Form.state.pendingFormConfig}. If both are equal, return 
     * the {Form.state.pendingFormConfig}, otherwise set the 
     * {Form.state.pendingFormConfig} to <code>null</code> and return <code>null</code>.
     * @returns {Form.state.pendingFormConfig}
     */
    reconcileTargetWithPendingFormConfig() {
        // Format of targetOnCompletion: /webform/create/post?fid=form172d18039a7
        const targetOnCompletion = this.state.formConfig.targetOnCompletion;
        const pendingConfig = this.state.pendingFormConfig;
        var result = null;
        if(targetOnCompletion !== null && targetOnCompletion !== undefined
                && pendingConfig !== null
                && pendingConfig !== undefined) {
            const pos = targetOnCompletion.indexOf("?");
            if(pos !== -1) {
                const len = targetOnCompletion.length;
                const query = targetOnCompletion.substring(pos, len);
                const parsed = queryString.parse(query);
                if(parsed.fid === pendingConfig.fid) {
                    result = pendingConfig;
                }
            }
        }
        log.trace(() => "Output: " + result + ", target on completion: " + 
                targetOnCompletion + ", pendingFormConfig.fid: " + 
                (pendingConfig ? pendingConfig.fid : null));
        return result;
    }
    
    getSuccessMessage(msg) {
        if( ! msg) {
            msg = "Success";
        }
        return { errors: null, infos: {"0": msg} };
    }
    
    onSuccessSubmit(response, target) {

        formUtil.logResponse(response, "Form#onSuccessSubmit");
        
        const lastStage = (this.isLastStage() === true);
        
        if(lastStage) {
            
            log.trace("Last stage successful: ", this.state.formConfig);
            
            const pendingFormConfig = this.reconcileTargetWithPendingFormConfig();
            
            ///////////////////////////// NOTE /////////////////////////////
            // If there is a Form.state.pendingFormConfig we load it.
            // But we first load initial data from the api, again. When we
            // did not load initial data at this point SESSION WAS LOST
            //
            if(pendingFormConfig !== null && pendingFormConfig !== undefined) {

                // Add the newly created entity to the formConfig
                formUtil.addNewlyCreatedToForm(response, pendingFormConfig);
                
                // This contains web page path: /webform/create/post?fid=form172d4d3fa82
                // However, we want api path: /webform/api/create/post?fid=form172d4d3fa82
                // So we append the query part of this path to the path 
                // containing the api path.
                // 
//                const path = this.state.formConfig.targetOnCompletion;
                const base = this.buildDefaultPath(pendingFormConfig);
                const path = base + '?fid=' + pendingFormConfig.fid;

                const onSuccess = (response) => {
                    
                    const formConfig = response.entity;
                    
                    // for collecting initial form values
                    var formValues = formUtil.collectFormData(formConfig);
                    
                    formValues = formUtil.collectFormData(pendingFormConfig, formValues);
                    
                    log.debug("Form#onSuccessSubmit form values: ", formValues);
                    
                    const stateUpdate = this.getRefreshedState(
                            {}, formValues, this.getSuccessMessage());
                    
                    stateUpdate.formConfig = formConfig;
                    stateUpdate.pendingFormConfig = null;
    
                    // This kind of transition requires replacing the entire
                    // FormConfig with the update.
                    //
                    const replaceEntirely = true;
                    this.updateStates(stateUpdate, replaceEntirely);
                };
                
                this.getRequest(path, onSuccess);
                
            }else{
                
                this.loadInitialData(this.getSuccessMessage());
            }
        }else{
            
            // Move to the first stage, to prepare for form inputs all over agin
            const nextStage = lastStage ? webformStage.BEGIN : this.nextStage();

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
        
        const eventName = "onSubmit";

        const clientConfig = this.buildClientConfig(eventName);
        
        log.debug("Form#onSubmit, submitting: " + 
                clientConfig.path + "\n", clientConfig);
        
        client(clientConfig).done(response => {
  
            this.onSuccessSubmit(response, clientConfig.path);
            
        }, response => {
            
            this.onError(response, clientConfig.path);
        });
    }
    
    isFormDisabled() {
        const stage = this.state.context.stage;
        const action = this.state.formConfig.action;
        const result = (stage === webformStage.VALIDATE || action === "read");
        log.trace(() =>
                "Form#isFormDisabled " + result + ", State.context: " +
                JSON.stringify(this.state.context));
        return result;
    }

    getFormHeading() {
        const formName = this.state.formConfig.form.displayName;
        const stage = this.state.context.stage;
        const action = this.state.formConfig.action;
        let result;
        if(action === "read") {
            result = "Details for selected " + formName;
        }else if(stage === webformStage.BEGIN) {
            result = "Enter " + formName + " details";
        }else if(stage === webformStage.VALIDATE) {
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
                <FormRows {...(this.props)}
                          form={form} 
                          values={this.state.values} 
                          disabled={this.isFormDisabled()} 
                          onChange={this.onChange}
                          onClick={this.onClick}
                          onBlur={this.onBlur}
                          onBeginReferencedForm={this.onBeginReferencedForm}/>

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
        const formRows = this.props.form.members
            .filter((formMember) => formMember.type !== 'hidden')
            .map(formMember =>
                <FormRow {...(this.props)}
                         key={formMember.id + '-row'} 
                         ref={formMember.id + '-row'}   
                         form={this.props.form} 
                         formMember={formMember} 
                         value={this.getValue(formMember.name)}
                         disabled={this.props.disabled}
                         onChange={this.props.onChange}
                         onClick={this.props.onClick}
                         onBlur={this.props.onBlur}
                         onBeginReferencedForm={this.props.onBeginReferencedForm}/>
        );
        
        return (formRows);
    }
};

class FormRow extends React.Component{
    
    constructor(props) {
        super(props);
        log.trace("FormRow#<init>. Props: ", this.props);
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
                                      value={this.props.value}
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
        
        return (
            <div className="form-row">
                <FieldHeading formMember={this.props.formMember}/>

                {(this.props.formMember.type === 'checkbox') && (' ') || (<br/>)}

                {config.displayField && this.getFormField()}
                
                {config.displayLink && (
                        <tt>{config.message.prefix}
                            <a href="#" target="_blank"
                               onClick={(e) => this.props.onBeginReferencedForm(e, config.link)} 
                               >{config.message.value}
                             </a>
                        </tt>
                    )
                }
            </div>    
        );
    }
};

export default Form;
    
