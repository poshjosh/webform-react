package com.looseboxes.webform.react;

import com.bc.jpa.spring.JpaConfiguration;
import com.looseboxes.webform.react.domain.BlogType;
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

    /**
     * Use this to add additional packages to search for entity classes.
     * That is, in addition to those specified in the
     * {@link javax.persistence.EntityManagerFactory EntityManagerFactory} i.e
     * the <tt>META-INF/persistence.xml</tt> file.
     * 
     * In this case we add the package which contains enum types, as enum types 
     * are often not captured whenever database is generated from existing entity 
     * classes. 
     */
    @Bean JpaConfiguration.AdditionalEntityPackageNamesSupplier 
            additionalEntityPackageNamesSupplier() {
        return () -> new String[]{BlogType.class.getPackage().getName()};        
    }
}
