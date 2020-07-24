package com.looseboxes.webform.react;

import com.bc.jpa.dao.JpaObjectFactory;
import com.bc.jpa.dao.JpaObjectFactoryBase;
import com.bc.jpa.dao.sql.SQLDateTimePatterns;
import com.looseboxes.webform.config.AbstractWebformJpaConfiguration;
import com.looseboxes.webform.react.domain.BlogType;
import javax.persistence.EntityManagerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Scope;

/**
 * @author hp
 */
@Configuration
public class WebformJpaConfiguration extends AbstractWebformJpaConfiguration{
    
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

    /**
     * Use this to add additional packages to search for entity classes.
     * That is, in addition to those specified in the
     * {@link javax.persistence.EntityManagerFactory EntityManagerFactory} i.e
     * the <tt>META-INF/persistence.xml</tt> file.
     * 
     * In this case we add the package which contains enum types, as enum types 
     * are often not captured whenever database is generated from existing entity 
     * classes. 
     * @return 
     */
    @Override
    public String [] getAdditionalEntityPackageNames() {
        // We add an enumeration type
        return new String[]{BlogType.class.getPackage().getName()};
    }

    @Override
    @Bean @Scope("singleton") public JpaObjectFactory jpaObjectFactory() {
        return new WebformJpaObjectFactory(entityManagerFactory(), sqlDateTimePatterns());
    }
}
