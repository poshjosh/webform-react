const misc = {

    rightWayToIterateThroughFormMembers: function(formConfig) {
        
        const formMembers = formConfig.form.members;


//            Did not work. Each formMember when printed = a serial beginning from zero
//            for(const formMember in formMembers) { }

//            formMembers = JSON.parse(JSON.stringify(formConfig.form.members));
//            log.debug("Type of: " + typeof(formMembers)); // object
//            Did not work. Each formMember when printed = a serial beginning from zero
//            for(const formMember in formMembers) { }

        formMembers.forEach((formMember, index) => {
            
        });
    },
    
    sendAGetHttpRequestManually(path) {
        
        // create a new XMLHttpRequest
        const request = new XMLHttpRequest();

        // get a callback when the server responds
        request.addEventListener('load', () => {

            // update the state of the component with the result here
        });

        // open the request with the verb and the url
        request.open('GET', path);

        // send the request
        request.send();
    }
};

