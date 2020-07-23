package com.looseboxes.webform.react;

import com.looseboxes.webform.web.FormConfigDTO;
import com.looseboxes.webform.web.FormConfigResponseHandler;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.http.ResponseEntity;
import com.looseboxes.webform.web.ResponseHandler;

@SpringBootApplication(scanBasePackageClasses = {
        com.looseboxes.webform.react.WebformApplication.class, 
        com.looseboxes.webform.WebformBasePackageClass.class
})
public class WebformApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(WebformApplication.class, args);
    }

    @Bean public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
        return new SampleDataLoader(ctx);
    }

    @Bean public ResponseHandler<FormConfigDTO, ResponseEntity<FormConfigDTO>> responseHandler() {
        return new FormConfigResponseHandler();
    }
}
