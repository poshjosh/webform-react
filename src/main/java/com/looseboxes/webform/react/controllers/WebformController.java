package com.looseboxes.webform.react.controllers;

import com.looseboxes.webform.Params;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Controller;
import org.springframework.ui.ModelMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * @author hp
 */
@Controller
@RequestMapping(WebformConstants.ENDPOINT)
public class WebformController {
    
    private static final Logger LOG = LoggerFactory.getLogger(WebformController.class);
    
    @GetMapping("/{"+Params.ACTION+"}/{"+Params.MODELNAME+"}")
    public String displayFormBasedOnPathVariables(ModelMap model, 
            @ModelAttribute(Params.ACTION) @PathVariable(name=Params.ACTION, required=false) String action, 
            @ModelAttribute(Params.MODELNAME) @PathVariable(name=Params.MODELNAME, required=false) String modelname) {
        
        return this.displayForm(model, action, modelname);
    }

    @GetMapping
    public String displayFormBasedOnRequestParams(ModelMap model, 
            @ModelAttribute(Params.ACTION) @RequestParam(name=Params.ACTION, required=false) String action, 
            @ModelAttribute(Params.MODELNAME) @RequestParam(name=Params.MODELNAME, required=false) String modelname) {
    
        return this.displayForm(model, action, modelname);
    }
    
    private String displayForm(ModelMap model, String action, String modelname) {
        // All attributes or nothing
        if( ! this.isNullOrEmpty(action) && ! this.isNullOrEmpty(modelname)) {
            this.addApiEndpoint(model);
        }
        
        LOG.debug("#displayForm. ModelMap: {}", model);
        
        return WebformConstants.TEMPLATE_PAGE;
    }
    
    private void addApiEndpoint(ModelMap model) {
        model.addAttribute(WebformConstants.PARAM_BASEPATH, WebformConstants.ENDPOINT);
    }
    
    private boolean isNullOrEmpty(String s) {
        return s == null || s.isEmpty();
    }
}
