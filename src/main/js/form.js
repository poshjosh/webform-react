'use strict';

import React from "react";
import ReactDOM from "react-dom";
import client from "./client";
import FormRow from "./formRow";
import formDataBuilder from "./formDataBuilder";
import formUtil from "./formUtil";
import formMemberUtil from "./formMemberUtil";
import webformStage from "./webformStage";
import log from "./log";
//log.init({logLevel: 'debug'});

/**
 * @param {string} action - One of: [create|read|update|delete]
 * @param {string} modelname - The name of the model for which a form will be displayed
 * @param {string} id - (optional) The id for the model. Not required for <code>create</code>
 * @param {string} basepath - (optional) The context path (without the domain). Prefix to all URLs.
 * @param {string} apibasepath - (optional) The path to the api (without the domain) e.g <code>/api</code>
 * @param {string|bool} asyncvalidation - (optional) If true validation will be done for each input as a value is entered.
 * @param {function} onSubmit - (optional) function to handle onSubmit event
 * Takes 2 arguments, the event and an object. The object is of format:
 * <code>
 * {
 *      method: 'POST', 
 *      path: path,
 *      headers: { "Content-Type": "multipart/form-data" },
 *      entity: entity
 * };
 * </code>
 * @param {function} getFormHeading - (optional) Takes 2 arguments: FormConfig {object} and stage (string).
 * @param {boolean|string} returnHere - (optional) If true, this form will return to the
 * referrer on completion.
 * @param {string} - search (optional) The query to append to the URL submitted by the form
 * @param {boolean|string} - express (optional) The default process involves
 * the followig stages DISPLAY -> VALIDATE - SUBMIT. If express is true, then
 * VALIDATE and SUBMIT are combined.
 * @param {string} - messageToDisplayWhileLoading - (optional) default = ..loading
 * 
 * @param {function} onSuccessInitialLoad - (optional) Takes 2 argument. The path
 * that was requested and the state update; returns the updated state.
 * <code>onSuccessInitialLoad(path, stateUpdate)</code>
 * 
 * Sample state:
 * <code><pre>
 *      {
 *          context: {stage: webformStage.BEGIN},
 *          formConfig: formConfig,
 *          values: formValues,
 *           messages: messages
 *      };
 * </pre></code>
 * 
 * @param {function} getReferencedFormConfig - (optional)
 * @param {function} getReferencedFormMessage -(optional)
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
            if(replace === true) {
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
        const errors = response.entity.errors;

        const infos = response.entity.infos;
        
        const messages = { errors: null, infos: null };
        if(errors) {
            log.debug("Errors: ", errors); 
            messages.errors = errors;
        }
        if(infos) {
            log.trace("Infos: ", infos);
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
        log.trace("Form#onSuccessInitialLoad ", formConfig);
//        log.trace("Form#onSuccessInitialLoad ", formConfig.form);
        
        const formValues = formUtil.collectFormData(formConfig);
        
        var stateUpdate = this.getRefreshedState(formConfig, formValues, messages);
        
        stateUpdate.doneInitialLoadData = true;

        if(this.props.onSuccessInitialLoad) {
            
            const ret = this.props.onSuccessInitialLoad(path, stateUpdate);
            
            if(ret) {
                stateUpdate = ret;
            }
        }
        
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
        var path = formUtil.buildPathFor(this.props, formConfig);
        path = formUtil.addReturnToIfSpecified(this.props, path);
        path = formUtil.addSearchPropertyIfPresent(this.props, path);
        return path;
    }
    
    loadInitialDataForConfig(formConfig = this.state.formConfig, messagesOnSuccess) {
        const path = this.buildDefaultPath(formConfig);
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

    getEventTargetValue(event, formMember) {
        const eventTarget = event.target;
        return formMember.type === 'checkbox' || formMember.type === 'radio' ? 
                eventTarget.checked : eventTarget.value;
    }

    handleEvent(event, eventName, formMember) {
//        log.debug("Form#handleEvent entering");        

        // We don't need preventDefault for onChange etc
        // We particularly need it for onSubmit
        // https://github.com/facebook/react/issues/13477#issuecomment-565609467
        // 
//        event.preventDefault();
        
//        formUtil.logEvent(event, eventName);
        
        const eventTarget = event.target;
//        log.debug("Form#handleEvent " + eventName);        
        
        // HTML option tags do not contain a name, the name is specified at
        // the parent select tag. However it is the option that receives events
        // So in such cases we extract the name from the formMember
        const name = eventTarget.name ? eventTarget.name : formMember.name;
//        log.debug("Form#handleEvent target name: " + name);        
        
        const value = this.getEventTargetValue(event, formMember);
                
        log.trace(() => "Form#handleEvent " + eventName + " " + name + " = " + value);        

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
        
        const clientConfig = formDataBuilder.buildHttpConfigForFormMember(
                this.state.formConfig, eventName, name, value, this.props);
        
        log.trace("Form#handleEvent, submitting: " + 
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
        log.trace(() => "Form#isEventAccepted. accepted: " + 
                accepted + ", FormMember: " + formMember.name);
        return accepted;
    }

    onChange(formMember, event) {
        log.trace("Form#onChange: ", event.target.value)
        if(this.isEventAccepted(event, formMember)) {
            this.handleEvent(event, "onChange", formMember);
        }
    }
    
    onClick(formMember, event) {
        log.trace("Form#onClick: ", event.target.value)
        if(this.isEventAccepted(event, formMember)) {
            const value = this.getEventTargetValue(event, formMember);
            if(value !== null && value !== "" && value !== undefined) {
                this.handleEvent(event, "onClick", formMember);
            }
        }
    }
    
    onBlur(formMember, event) {
        log.trace("Form#onBlur: ", event.target.value)
        if(this.props.asyncvalidation === true || this.props.asyncvalidation === 'true') {
            if(this.isEventAccepted(event, formMember)) {
                this.handleEvent(event, "onBlur", formMember);
            }
        }
    }

    nextStage() {
        const currStage = this.state.context.stage;
        var nextStage = webformStage.next(currStage, this.props.express);
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
            const basepath = formUtil.basepath(this.props);
            const rhs = formUtil.buildPath(basepath, [formConfig.action]);
            result = path.indexOf(rhs) === 0;
            log.debug(() => "Form#pathMatchesFormConfig " + 
                    result + ", lhs: " + path + ", rhs: " + rhs);
        }
        return result;
    }
    
    onSuccessSubmit(response, requestedPath) {

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
                        const updatedFormMember = formMemberUtil.addNewlyCreated(response, pendingFormConfig);
                        
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
                            if(updatedFormMember !== null && updatedFormMember !== undefined) {
                                formValues[updatedFormMember.name] = updatedFormMember.value;
                                log.trace(() => "Updated form value: " + 
                                        updatedFormMember.name + " = " + updatedFormMember.value);
                            }

                            log.trace("Form#onSuccessSubmit form values: ", formValues);

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
        
        const formConfig = this.state.formConfig;
        const eventName = "onSubmit";
        const values = this.state.values;
        const currentFormStage = this.state.context.stage;
        
        const clientConfig = formDataBuilder.buildHttpConfigForForm(
                formConfig, eventName, values, currentFormStage, this.props);
        
        if(this.props.onSubmit) {
            
            this.props.onSubmit(event, clientConfig);
            
        }else{
            
            log.debug("Form#onSubmit, submitting: " + 
                    clientConfig.path + "\n", clientConfig);

            client(clientConfig).done(response => {

                this.onSuccessSubmit(response, clientConfig.path);

            }, response => {

                this.onError(response, clientConfig.path);
            });
        }
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
        
        log.trace("Form#render state.values: ", this.state.values);
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

            const errors = this.state.messages.errors;
            log.trace("Form#render errors: ", errors);
            let errorMsg;
            if(errors && errors.length == 1) {
                errorMsg = "Please review one error below";
            }else if(errors && errors.length > 1) {
                errorMsg = "Please review " + errors.length + " errors below"
            }else{
                errorMsg = null;
            }
            const errorHtm = errorMsg === null ? null : <div autoFocus className="error-message">{errorMsg}</div>;
            
            const infos = this.state.messages.infos;
            log.trace("Form#render infos: ", infos);
            
            htm = <form>
    
                {headingHtm}
                
                {errorHtm}
                
                <FormMessages id="infos" ref="infos" 
                              className="info-message" 
                              messages={infos}/>
                
                <FormRows {...(this.props)}
                          errors={errors}
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
    toDisplayFormat(message) {
        if(message.fieldName) {
            return message.fieldName + ": " + message.message;        
        }else{
            return message.message;
        }
    }
    render() {
        log.trace("FormMessages#render messages: ", this.props.messages);
        const hasMessages = this.hasValues(this.props.messages);
        const messageRows = hasMessages === false ? null : 
                Object.values(this.props.messages).map((message, index) => 
                <div key={"message-group-message-" + this.props.id + '-'+ index} 
                     className={this.props.className}>
                     {this.toDisplayFormat(message)}
                </div>
        );
        return messageRows === null ? null : <div autoFocus className="message-group">{messageRows}</div>;
    }
};

class FormRows extends React.Component{
    /**
     * A message is for a specific node if it starts with the 
     * <code>node.id</code> or <code>node.name</code>
     * 
     * @param {object} messages A collection of messages
     * @param {object} formMember The formMember whose HTML node messages will 
     * be collected for.
     * @param {array} collectInto Optional array to collect the formMember 
     * specific messages into.
     * @returns {array} An array of zero or more messages specific to the 
     * specified formMember. 
     */
    collectFormMemberMessages(messages, formMember, collectInto = []) {
        
        if(messages !== null && messages !== undefined && messages) {
            
            messages.forEach((errMsg, index) => {

                if(errMsg.fieldName === formMember.name) {

                    collectInto[index] = errMsg;
                }
            });
        }
        
        return collectInto;
    }
    
    getValue(name) {
        return this.props.values[name];
    }
    
    render() {
        
        const formRows = this.props.form.members
            .filter((formMember) => formMember.type !== 'hidden')
            .map(formMember => 
                <FormRow {...(this.props)}
                         errors={this.collectFormMemberMessages(this.props.errors, formMember)}
                         form={this.props.form} 
                         value={this.getValue(formMember.name)} 
                         disabled={this.props.disabled} 
                         onChange={this.props.onChange}
                         onClick={this.props.onClick}
                         onBlur={this.props.onBlur}
                         onBeginReferencedForm={this.props.onBeginReferencedForm}
                         key={formMember.id + '-row'} 
                         ref={formMember.id + '-row'}   
                         formMember={formMember}/>
        );
        
        return (formRows);
    }
    
    /**
     * @param {string} The path to append the current location to
     * @returns {string} The updated path
     * @deprecated Users should provide any query they intend to add (to the 
     * path this Form component will submit to the api) via the search property. 
     */
    addCurrentLocation(path) {
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
//        return path;
    }
};

export default Form;
    
