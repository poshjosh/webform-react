package com.looseboxes.webform.react.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * @author hp
 */
@Controller
public class IndexController {
    
    @GetMapping("/")
    public String home() {
        return "index";
    }
}
