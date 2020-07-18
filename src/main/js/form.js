'use strict';

import React from "react";
import ReactDOM from "react-dom";
import client from "./client";
import FormRow from "./formRow";
import formUtil from "./formUtil";
import webformStage from "./webformStage";
import log from "./log";
//log.init({logLevel: 'debug'});

/**
 * @param {string} action - One of: [create|read|update|delete]
 * @param {string} modelname - The name of the model for which a form will be displayed
 * @param {string} id - (optional) The id for the model. Not required for <code>create</code>
 * @param {string} basepath - (optional) The context path (without the domain). Prefix to all URLs.
 * @param {string} apibasepath - (optional) The path to the api (without the domain) e.g <code>/api</code>
 * @param {string|bool} asyncvalidation - If true validation will be done for each input as a value is entered.
 * @param {function} getFormHeading - Takes 2 arguments: FormConfig {object} and stage (string).
 * @param {string} messageToDisplayWhileLoading - (optional) default = ..loading
 * @param {function} getReferencedFormConfig
 * @param {function} getReferencedFormMessage
 * 
 * Sample referenced form config:
 * <code>
 * <pre>
 * {
 *     displayField: true,
 *     displayLink: true,
 *     messsage: "Blog is required",
 *     link: {
 *         href: "/api/webform/create/blog/?parentfid=form172ceff22f8&targetOnCompletion=/webform/create/post?fid=form172ceff22f8",
 *         text: "Create one"
 *     }    
 * }
 * </pre>
 * </code>
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
            doneInitialLoadData: false,
            context: {stage: webformStage.BEGIN},
            formConfig: null,
            pendingFormConfig: null,
            values: null,
            messages: { errors: null, infos: null }
        };
    }
    
    /**
     * @param {target} update The new state
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
        // Recently a single message was of format: ["handle: must not be blank"]
        const errors = response.entity["webform.messages.errors"];

        const infos = response.entity["webform.messages.infos"];
        
        const messages = { errors: null, infos: null };
        if(errors) {
            log.debug("Errors: ", errors); // Errors: ["handle: must not be blank"]
            messages.errors = errors;
        }
        if(infos) {
            log.debug("Infos: ", infos);
            messages.infos = infos;
        }
        
        if(messages !== null && messages !== undefined) {
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
    
    onSuccessInitialLoad(response, path, messages) {
        formUtil.logResponse(response, "Form#onSuccessInitialLoad");
        
        const formConfig = response.entity;
        
        const formValues = formUtil.collectFormData(formConfig);
        
        const stateUpdate = this.getRefreshedState(formConfig, formValues, messages);
        
        stateUpdate.doneInitialLoadData = true;
        
        this.updateStates(stateUpdate);
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

    loadInitialData(path, messagesOnSuccess) {
        log.trace("Form#loadInitialData. GET ", path);
        this.getRequest(path,
            (response) => this.onSuccessInitialLoad(response, path, messagesOnSuccess),
            (response) => this.onError(response, path));
    }
    
    buildDefaultPath(formConfig = this.state.formConfig) {
        return formUtil.buildPathFor(this.props, formConfig);
    }
    
    loadInitialDataForConfig(formConfig = this.state.formConfig, messagesOnSuccess) {
        
        var path = this.buildDefaultPath(formConfig);
  
        // Adding the currently displaying query i.e via window.location.search
        // proved problematic. We cannot accurately predict what the query will 
        // contain at any given time. For example it once contained a formid
        // for a form which had already been completed... leading to errors.
        // 
        // {"href":"http://localhost:9010/webform/create/post?myname=nonso","origin":"http://localhost:9010","protocol":"http:","host":"localhost:9010","hostname":"localhost","port":"9010","pathname":"/webform/create/post","search":"?myname=nonso","hash":""}
//        log.trace("Location: ", window.location);
//        const queryString = window.location.search;
//        if(queryString !== null && queryString !== undefined) {
//            if(path.indexOf('?') === -1) {
//                log.trace("Adding query string to path: " + queryString);
//                path = path + queryString;
//            }else{
//                log.debug("Path already contains a query string, so will not add: " + queryString);
//            }
//        }
        
        this.loadInitialData(path, messagesOnSuccess);
    }
    
    onBeginReferencedForm(event, path) {
        
        event.preventDefault();
        
        log.trace("Form#onBeginReferencedForm, path: ", path);

        // This kind of transition requires replacing the entire
        // FormConfig with the update.
        //
        const replaceEntirely = true;
        this.updateStates({ pendingFormConfig: this.state.formConfig }, replaceEntirely);
        
        this.loadInitialData(path);
    }

    componentDidMount() {
        this.loadInitialDataForConfig();
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

        const path = formUtil.buildPathFor(this.props, formConfig, suffix);
        
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

        const path = formUtil.buildPathFor(this.props, formConfig, suffix);

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
    
    getSuccessMessage(msg) {
        if( ! msg) {
            msg = "Success";
        }
        return { errors: null, infos: {"0": msg} };
    }
    
    isApiPath(path) {
        const apibasepath = formUtil.apibasepath(this.props);
        return path && apibasepath && path.indexOf(apibasepath) === 0;
    }
    
    pathMatchesFormConfig(path, formConfig = this.state.formConfig) {
        let result;
        if(path === null || path === undefined ||
                formConfig === null || formConfig === undefined) {
            result = false;
        }else{
            const path = [formConfig.action];
            const basepath = formUtil.basepath(this.props);
            const rhs = formUtil.buildPath(basepath, path);
            result = path.indexOf(rhs) === 0;
            log.debug(() => "Form#pathMatchesFormConfig " + 
                    result + ", lhs: " + path + ", rhs: " + rhs);
        }
        return result;
    }
    
    onSuccessSubmit(response, target) {

        formUtil.logResponse(response, "Form#onSuccessSubmit");
        
        const lastStage = (this.isLastStage() === true);
        
        const formConfig = response.entity;

        if(lastStage) {
            
            const targetOnCompletion = formConfig.targetOnCompletion;
            
            log.trace("Form#onSuccessSubmit lastState targetOnCompletion: ", targetOnCompletion);

            // targetOnCompletion=/webform/create/post?fid=form172f81dc203
            if(targetOnCompletion === null || targetOnCompletion === undefined){
                
                this.loadInitialDataForConfig(formConfig, this.getSuccessMessage());
                
            }else{
                
                if(this.pathMatchesFormConfig(targetOnCompletion, formConfig) === false) {
                    
                    if(this.isApiPath(targetOnCompletion)) {
                        
                        log.debug("Form#onSuccessSubmit Returning to: " + targetOnCompletion);

                        this.loadInitialData(targetOnCompletion, this.getSuccessMessage());
                        
                    }else{
                
                        log.debug("Form#onSuccessSubmit Relocating to: " + targetOnCompletion);

                        window.location = targetOnCompletion;
                    }
                }else{
                    
                    ///////////////////////////// NOTE /////////////////////////////
                    // If there is a Form.state.pendingFormConfig and it has a
                    // formId that matches that specified in targetOnCompletion,
                    // we load it. Before we load it, we load initial data from
                    // the api, again. When we did not load initial data at this 
                    // point SESSION WAS LOST
                    //
                    const pendingFormConfig = this.state.pendingFormConfig;

                    const usePending = formUtil.hasMatchingFormId(pendingFormConfig, targetOnCompletion);

                    log.trace(() => "Form#onSuccessSubmit Use pending FormConfig: " + 
                            usePending + ", target on completion: " + 
                            targetOnCompletion + ", pendingFormConfig.fid: " + 
                            (pendingFormConfig ? pendingFormConfig.fid : null));

                    if(usePending === false) {
                        
                        this.loadInitialDataForConfig(formConfig, this.getSuccessMessage());
                        
                    }else{    

                        // Add the newly created entity to the formConfig
                        formUtil.addNewlyCreatedToForm(response, pendingFormConfig);

                        // This contains web page path: /webform/create/post?fid=form172d4d3fa82
                        // However, we want api path: /api/webform/create/post?fid=form172d4d3fa82
                        // So we do some formatting
                        // 
//                        const path = this.state.formConfig.targetOnCompletion;
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
                    }
                }
            }            
        }else{
            
            // Move to the first stage, to prepare for form inputs all over agin
            const nextStage = lastStage ? webformStage.BEGIN : this.nextStage();

            this.updateStates({
                context: { stage: nextStage },
                formConfig: formConfig,
                messages: { errors: null, infos: null }
            });
        }
        
        formUtil.logFormConfig(formConfig, "Form#onSuccessSubmit");
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
                log.toMessage(this.state.context));
        return result;
    }

    getFormHeading(formConfig = this.state.formConfig, stage = this.state.context.stage) {
        let result;
        if(this.props.getFormHeading) {
            result = this.props.getFormHeading(formConfig, stage);
        }else{
            const formName = formConfig.form.displayName;
            const action = this.state.formConfig.action;
            if(action === "read") {
                result = "Details for selected " + formName;
            }else if(stage === webformStage.BEGIN) {
                result = "Enter " + formName + " details";
            }else if(stage === webformStage.VALIDATE) {
                result = "Confirm " + formName + " entries";
            }else{
                result = formName + " Form";
            }
        }
        return result;
    }

    render() { 
        
        const form = this.state.formConfig !== null ? this.state.formConfig.form : null;
        formUtil.logForm(form, "Form#render");
             
        let htm;
        
        if(this.state.doneInitialLoadData === false) {
            
            const loading = this.props.messageToDisplayWhileLoading ? 
                    this.props.messageToDisplayWhileLoading : "..loading";
            htm = <div>{loading}</div>;
            
        }else if(form === null || form === undefined) {
            
            htm = <div>Received an unexpected response from the remote server. Try refreshing</div>;
            
        }else{
            const formHeading = this.getFormHeading();
            const headingHtm = formHeading === undefined && formHeading === null ? "" :
                    <div className="form-heading">{formHeading}</div>;
            htm = <form>
    
                {headingHtm}
                
                <FormMessages id="errors" ref="errors" className="error-message" messages={this.state.messages.errors}/>
                <FormMessages id="infos" ref="infos" className="info-message" messages={this.state.messages.infos}/>
                
                <FormRows {...(this.props)}
                          errors={this.state.messages.errors}
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
            </form>;
        }
        
        return htm;
    }
};

class FormMessages extends React.Component{
    hasValues(target) {
        const result = target !== null && target ? true : false;
        log.trace("FormMessages#hasValues: ", result);
        return result;
    }
    render() {
        // Sample format
        // {"0":"The following field(s) have errors","1":"type: must not be null","2":"handle: must not be blank"}
        // Recently a single message was of format: ["handle: must not be blank"]
        log.trace("FormMessages#render messages: ", this.props.messages);
        const hasMessages = this.hasValues(this.props.messages);
        const messageRows = hasMessages === false ? null : 
                Object.values(this.props.messages).map((message, index) => 
                <div key={this.props.id + '-'+ index} className={this.props.className}>{message}</div>
        );
        return messageRows === null ? null : <div className="message-group">{messageRows}</div>;
    }
};

class FormRows extends React.Component{
    
    /**
     * A message is for a specific node if it starts with the 
     * <code>node.id</code> or <code>node.name</code>
     * 
     * @param {object} messages A collection of messages
     * Format <code>{"0":"The following field(s) have errors","1":"type: must not be null","2":"handle: must not be blank"}</code>
     * @param {object} formMember The formMember whose HTML node messages will 
     * be collected for.
     * @param {array} collectInto Optional array to collect the formMember 
     * specific messages into.
     * @returns {array} An array of zero or more messages specific to the 
     * specified formMember. Format <code>["type: must not be null"]</code>
     */
    collectFormMemberMessages(messages, formMember, collectInto = []) {
        
        if(messages !== null && messages !== undefined && messages) {
            
            messages.forEach((errMsg, index) => {

                if(errMsg.startsWith(formMember.name)) {

                    collectInto[index] = errMsg;
                }
            });
        }
        
        return collectInto;
    }
    
    getValue(name) {
        return ! this.props.values ? '' : 
               ! this.props.values[name] ? '' : this.props.values[name];
    }
    
    render() {
        
        const formRows = this.props.form.members
            .filter((formMember) => formMember.type !== 'hidden')
            .map(formMember =>
                <FormRow {...(this.props)}
                         errors={this.collectFormMemberMessages(this.props.errors, formMember)}
                         key={formMember.id + '-row'} 
                         ref={formMember.id + '-row'}   
                         formMember={formMember} 
                         value={this.getValue(formMember.name)}/>
        );
        
        return (formRows);
    }
};

export default Form;
    
