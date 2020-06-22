package com.looseboxes.webform.react;

import com.bc.jpa.dao.JpaObjectFactory;
import com.bc.jpa.dao.JpaObjectFactoryBase;
import com.bc.jpa.dao.sql.SQLDateTimePatterns;
import com.looseboxes.webform.JpaConfiguration;
import javax.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

/**
 * @author hp
 */
@Configuration
public class WebformJpaConfiguration extends JpaConfiguration{
    
    // Exception occured when Hibernate calls JpaObjectFactory.close during
    // startup. The JpaObjectFactory.close method, closes the EntityManagerFactory 
    // Temporary Solution: Override the close method to do nothing.
    // The EntityManagerFactory is managed by Spring, so this should not be a problem.
    //
    private static class WebformJpaObjectFactory extends JpaObjectFactoryBase{
        public WebformJpaObjectFactory(
                EntityManagerFactory emf, 
                SQLDateTimePatterns sqlDateTimePatterns) {
            super(emf, sqlDateTimePatterns);
        }
        @Override
        public void close() {
//                super.close();
        }
    }
    
    @Autowired private EntityManagerFactory entityMangerFactory;
    
    @Override
    public EntityManagerFactory entityManagerFactory() {
        return this.entityMangerFactory;
    }

    @Override
    @Bean @Scope("singleton") public JpaObjectFactory jpaObjectFactory() {
        return new WebformJpaObjectFactory(entityManagerFactory(), sqlDateTimePatterns());
    }
}
