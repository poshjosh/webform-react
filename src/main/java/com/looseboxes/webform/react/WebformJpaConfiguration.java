package com.looseboxes.webform.react;

import com.bc.jpa.dao.JpaObjectFactory;
import com.bc.jpa.dao.JpaObjectFactoryBase;
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
    
    @Autowired private EntityManagerFactory entityMangerFactory;

    @Override
    public EntityManagerFactory entityManagerFactory() {
        return this.entityMangerFactory;
    }

    @Override
    @Bean @Scope("singleton") public JpaObjectFactory jpaObjectFactory() {
//Exception occured when Hibernate calls JpaObjectFactory.close
//The JpaObjectFactory.close method, closes the EntityManagerFactory
//Temporary Solution: Override the close method to do nothing
//The EntityManagerFactory is managed by Spring, so this should not be a problem.

        return new JpaObjectFactoryBase(
                this.entityManagerFactory(), this.sqlDateTimePatterns()){
            @Override
            public void close() {
//                super.close();
            }
        };
    }
}
