const log = require('./log');

const formUtil = {

    buildTargetPath: function(props, suffix) {
        var target = props.basepath + '/' + props.action + '/' + props.modelname;
        if(suffix) {
            target = target + '/' + suffix;
        }
        return target;
    },

    /**
     * Update the first argument with values from the second.
     * Does some recursive updates for objects. Currently goes only one (1) 
     * Does not handle arrays etc
     * level deep.
     * @param {type} current
     * @param {type} update
     * @returns The first argument updated with values from the second argument.
     */
    updateObject: function(current, update) {

        const output = {};

        for(const name in update) {

            var value = current[name];

            let updatedValue;

            if(typeof(value) === 'object') {
                if( ! value) {
                    value = {};
                }
                updatedValue = Object.assign(Object.assign({}, value), update[name]);
            }else{
                updatedValue = update[name];
            }
            
            const logLevel = "trace";//name === "formConfig" ? "trace" : "debug";
            log.log(logLevel, "formUtil#updateObject " + name + " = " +
                    "\nCurrent: " + log.toMessage(value) + 
                    "\nUpdated: " + log.toMessage(updatedValue));

            output[name] = updatedValue;
        }

        return output;
    },
    
    /**
     * An update is only performed if the value exists in the source.
     * This prevents a situation where the server recieved <code>null</code> 
     * text as values.
     * @param {type} name The name of the property to update
     * @param {type} target The target for the new value
     * @param {type} source The source of the new value
     * @returns {undefined} Does not return anything
     */
    updateValue: function(name, target, source) {
        if(source[name]) {
            target[name] = source[name];
        }
    },
    
    collectConfigData: function(formConfig) {
        
        // buffer to collect form config data
        const buffer = {};

        // collect special fields used by the api
        formUtil.updateValue('parentfid', buffer, formConfig);
        formUtil.updateValue('fid', buffer, formConfig);
        formUtil.updateValue('mid', buffer, formConfig);
        formUtil.updateValue('targetOnCompletion', buffer, formConfig);
        formUtil.updateValue('modelfields', buffer, formConfig);
        log.trace("formUtil#collectConfigData. ", buffer);
        
        return buffer;
    },
    
    logFormConfig: function(formConfig, methodName, logLevel) {
        const form = formConfig === null ? null : formConfig.form;
        if(form !== null) {
            formUtil.logForm(form, methodName, logLevel);
        }
    },
    
    logForm: function(form, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'trace';
        }
        log.log(logLevel, () => 
            "formUtil->" + id + 
            "-> Form. name: " + (form ? form.name : null) + 
            ", members: " + (form ? form.memberNames : null)
        );
    },
    
    logResponse: function(response, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'debug';
        }
        log.log(logLevel, () => 
            "formUtil->" + id + "-> Response.headers: " + 
            (response ? log.toMessage(response.headers) : null)
        );
    },

    logEvent: function(event, id, logLevel) {
        if( ! logLevel) {
            logLevel = 'trace';
        }
        log.log(logLevel, () => 
                "formUtil->" + id + "-> Event.target: " + 
                event.target.name + "=" + event.target.value);
    }
};

module.exports = formUtil;