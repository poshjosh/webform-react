package com.looseboxes.webform.react.controllers;

import com.looseboxes.webform.controllers.FormControllerRest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * @author hp
 */
@RestController 
@RequestMapping(path = WebformControllerConstants.API_BASEPATH, 
        produces = MediaType.APPLICATION_JSON_VALUE)
public class WebformControllerRest extends FormControllerRest<Object>{

}
/**    
 * 

    private static final Logger LOG = LoggerFactory.getLogger(FormControllerRestImpl.class);
    
    private void print(String method, Object modelobject, String name, Object value) {
        
        if(modelobject instanceof Blog) {
            final Blog blog = (Blog)modelobject;
            LOG.info("xxx" + method + " " + name + " = " + value + ", of type: " + (value==null?null:value.getClass()));
            LOG.info("xxx" + method + "Blog.handle = " + blog.getHandle() + ", of type: " + (blog.getHandle() == null ? null : blog.getHandle().getClass()));
            LOG.info("xxx" + method + "Blog.type = " + blog.getType() + ", of type: " + (blog.getType() ==  null ? null : blog.getType().getClass()));
            LOG.info("xxx" + method + "Blog.enabled = " + blog.isEnabled() + ", of type: boolean");
        }else{
            LOG.info("xxx" + method + "Modelobject: " + modelobject + ", type: " + (modelobject == null ? null : modelobject.getClass()));
        }
    }

    @RequestMapping("/{"+Params.ACTION+"}/{"+Params.MODELNAME+"}/" + FormStage.dependents)
    @Override
    public ResponseEntity<Object> dependents(
            @Valid @ModelAttribute(ModelAttributes.MODELOBJECT) Object modelobject, 
            BindingResult bindingResult,
            ModelMap model, FormConfigDTO formConfigDTO,
            @RequestParam(name = "propertyName", required = true) String propertyName, 
            HttpServletRequest request, HttpServletResponse response) {
        
        this.print(FormStage.dependents, modelobject, propertyName, "N/A");
        
        return super.dependents(modelobject, bindingResult, model, formConfigDTO, propertyName, request, response);
    }

    @RequestMapping("/{"+Params.ACTION+"}/{"+Params.MODELNAME+"}/" + FormStage.validateSingle)
    @Override
    public ResponseEntity<Object> validateSingle(
            @Valid @ModelAttribute(ModelAttributes.MODELOBJECT) Object modelobject, 
            BindingResult bindingResult,
            ModelMap model, FormConfigDTO formConfigDTO,
            @RequestParam(name = "propertyName", required = true) String propertyName, 
            HttpServletRequest request, HttpServletResponse response) {
        
        this.print(FormStage.validateSingle, modelobject, propertyName, "N/A");
        
        return super.validateSingle(
                modelobject, bindingResult, model, formConfigDTO, propertyName, request, response);
    }
    
    @PostMapping("/{"+Params.ACTION+"}/{"+Params.MODELNAME+"}/validate")
    @Override
    public ResponseEntity<FormConfig> validate(
            @Valid @ModelAttribute(ModelAttributes.MODELOBJECT) Object modelobject,
            BindingResult bindingResult,
            ModelMap model,
            FormConfigDTO formConfigDTO,
            HttpServletRequest request, HttpServletResponse response) {
    
        if(modelobject instanceof Blog) {
            final Blog blog = (Blog)modelobject;
            LOG.info("Blog.handle = " + blog.getHandle() + ", of type: " + (blog.getHandle() == null ? null : blog.getHandle().getClass()));
            LOG.info("Blog.type = " + blog.getType() + ", of type: " + (blog.getType() ==  null ? null : blog.getType().getClass()));
        }else{
            LOG.info("Modelobject: " + modelobject + ", type: " + (modelobject == null ? null : modelobject.getClass()));
        }

        return super.validate(modelobject, bindingResult, model, formConfigDTO, request, response);
    }
 * 
 * 
 */
