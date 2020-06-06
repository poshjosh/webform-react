package com.looseboxes.webform.react;

import com.looseboxes.webform.util.PrintAppInfo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(scanBasePackageClasses = {
        com.looseboxes.webform.react.WebformApplication.class, 
        com.looseboxes.webform.WebformBasePackageClass.class
})
public class WebformApplication {
    
	public static void main(String[] args) {
		SpringApplication.run(WebformApplication.class, args);
	}

	@Bean
	public CommandLineRunner commandLineRunner(ApplicationContext ctx) {
		return new PrintAppInfo(ctx);
	}
}