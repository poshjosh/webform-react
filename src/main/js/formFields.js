const React = require('react');
const log = require('./log');


const WebformInputClass = {
    FORM_INPUT: "form-input",
    FORM_SELECT: "form-select",
    FORM_TEXTAREA: "form-textarea"
};

class InputField extends React.Component{
    render() {
        const className = WebformInputClass.FORM_INPUT;
        return (
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.props.formMember.type}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.form.id}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={this.props.value}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                size="35"
                maxLength={this.props.formMember.maxLength}
            />
        );
    }
};

class SelectField extends React.Component{
    render() {
        
        const choices = this.props.formMember.choices;

        log.trace("SelectField#render. Choices: ", choices);

        const options = [];
        
        for(const key in choices) {
            
            const val = choices[key];
            
            log.trace(() => "SelectField#render. " + key + " = " + val);
            
            const selected = key === this.props.value || val === this.props.value;
            
            if(selected === true) {
                log.trace(() => "SelectField#render. Selected: " + key + " = " + val);
            }
            
            const htm = <SelectOption 
                    key={key}
                    form={this.props.form} 
                    formMember={this.props.formMember} 
                    value={key}
                    label={val}
                    selected={selected}
                    disabled={this.props.disabled}/>;
                    
            log.trace("SelectField#render. ", htm);        
                            
            options.push(htm);                 
        }
        
        const className = WebformInputClass.FORM_SELECT;

        return (
            <select className={className + ' ' + this.props.formMember.type} 
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.form.id}
                name={this.props.formMember.name}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                value={this.props.value}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}>

                <option>Select {this.props.formMember.label}</option>

                {options}
                
            </select>
        );
    }
};

class SelectOption extends React.Component{
    render() {
        let htm;
        if(this.props.selected === true) {
            htm = (
                <option selected
                    disabled={this.props.disabled} 
                    name={this.props.formMember.name}
                    value={this.props.value}>
                    {this.props.label}
                </option>    
            );
        }else{
            htm = (
                <option 
                    disabled={this.props.disabled} 
                    name={this.props.formMember.name}
                    value={this.props.value}>
                    {this.props.label}
                </option>    
            );
        }
        return (htm);
    }
};

class CheckBoxField extends React.Component{
    /**
     * We do not set checked manually as this our fields are controlled
     * by React via the defaultValue/value property
     */
    render() {
        const className = WebformInputClass.FORM_INPUT;
        return (                
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.props.formMember.type}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.form.id}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                checked={this.props.value}
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
    render() {
        const className = WebformInputClass.FORM_INPUT;
        return (
            <input className={className + ' ' + this.props.formMember.type} 
                type={this.props.disabled ? 'text' : 'file'}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.form.id}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={this.props.value}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                size="35"
                maxLength={this.props.formMember.maxLength}
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
        return (
            <textarea className={className + ' ' + this.props.formMember.type} 
                rows={this.props.formMember.numberOfLines}
                disabled={this.props.disabled} 
                required={this.props.formMember.required}
                form={this.props.form.id}
                id={this.props.formMember.id}
                ref={this.props.formMember.id}
                name={this.props.formMember.name}
                value={this.props.value}
                placeholder={this.props.formMember.label}
                onChange={(e) => this.props.onChange(this.props.formMember, e)}
                onClick={(e) => this.props.onClick(this.props.formMember, e)}
                onBlur={(e) => this.props.onBlur(this.props.formMember, e)}
                />
        );
    }
};

module.exports = {
    InputField,
    SelectField,
    SelectOption,
    CheckBoxField,
    FileField,
    TextAreaField
};


