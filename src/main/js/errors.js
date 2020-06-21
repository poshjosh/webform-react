'use strict';

const errors = {
    
    requireValue: function(name, value) {
        if(value === null || value === undefined) {
            throw errors.notFound(name);
        }
        return value;
    },
    
    notFound: function(name = "property") {
        return {name:"NotFound", message: "Required " + name + " not found"};
    }    
};

export default errors;

