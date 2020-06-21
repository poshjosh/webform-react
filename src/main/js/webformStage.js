'use strict';

/**
 * The stage signifies what action has been completed. The initial stage is <code>begin</code>.
 * 
 * Each subsequent stage is set just after a successful response is returned 
 * from the api. For example from stage <code>begin</code> we send the form
 * data for validation; on successful return from that request, the stage is 
 * immediately set to <code>validate</code>
 * 
 * @type webformStage
 */
const webformStage = {
    
    BEGIN: "begin",
    VALIDATE: "validate",
    SUBMIT: "submit",
    
    SubStage: {
        VALIDATE_SINGLE: "validateSingle",
        DEPENDENTS: "dependents"
    },
    
    first: function() {
        return webformStage.BEGIN;
    },
    
    isFirst: function(stage) {
        return stage === webformStage.first();
    },
    
    last: function() {
        return webformStage.SUBMIT;
    },
    
    isLast: function(stage) {
        return stage === webformStage.last();
    },

    /**
     * @param {String} stage The stage for which the next stage is returned
     * @returns {String} The stage after the specified stage. If the specified 
     * stage is the last stage, returns the first stage.
     */
    next: function(stage){
        return stage === webformStage.BEGIN ? webformStage.VALIDATE :
                stage === webformStage.VALIDATE ? webformStage.SUBMIT : 
                webformStage.BEGIN;
    }
};

export default webformStage;


