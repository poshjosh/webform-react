var log = {
    
    logLevel : "info",
    
    canLog: function(level) {
        return log.getLogPriority(level) >= log.getLogPriority();
    },
    
    
    error: function(text, arg) {
        log.log('error', text, arg);
    },
    
    warn: function(text, arg) {
        log.log('warn', text, arg);
    },
    
    info: function(text, arg) {
        log.log('info', text, arg);
    },
    
    debug: function(text, arg) {
        log.log('debug', text, arg);
    },
    
    verbose: function(text, arg) {
        log.trace(text, arg);
    },

    trace: function(text, arg) {
        log.log('trace', text, arg);
    },

    /**
     * @param {any} level
     * @param {String} text
     * @param {any} arg
     * @returns true if the log was done, otherwise return false
     */
    log : function(level, text, arg) {
        
        if(log.canLog(level)) {
            const now = new Date();
            const pre = now.getHours() + ':' + now.getMinutes() + ':' + 
                        now.getSeconds() + '.' + now.getMilliseconds();
            try{
                
                arg = arg ? text + log.toMessage(arg) : log.toMessage(text);
                
                console.info(pre + " " + arg); 
                
                return true;
            }catch(err) { 
                try{
                    console.error(pre + " " + err);
                }catch(ignore) {}
            }
        }
        return false;
    },
    
    toMessage: function(arg) {
        return arg === null ? "null" : 
                arg === undefined ? "undefined" : 
                typeof(arg) === "object" ? JSON.stringify(arg, log.getCircularReplacer()) : 
                typeof(arg) === 'function' ? arg() : arg;
    },
    
    /**
     * Solution to cyclic error encountered when an object which referenes self
     * is passed to method JSON.stringify
     * Adapted from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Cyclic_object_value
     * @returns {Function}
     */
    getCircularReplacer: function() {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return;
                }
                seen.add(value);
            }
            return value;
        };
    },

    getLogLevel : function() {
        return log.logLevel;
    },
    
    getLogPriority: function(level) {
        if( ! level) {
            level = log.logLevel;
        }
        return level === 'off' ? 6 :
                level === 'error' ? 5 : 
                level === 'warn' ? 4 :
                level === 'info' ? 3 :
                level === 'debug' ? 2 : 
                level === 'trace' || level === 'verbose' ? 1 : 
                level === 'all' ? 0 : log.getLogPriority('off');
    },
    
    init : function(cfg) {
        
        if(cfg.hasOwnProperty('logLevel')) {
            log.logLevel = cfg.logLevel;
        }
        
        log.info("log#init Log level: " + cfg.logLevel);
    }
};

module.exports = log;

