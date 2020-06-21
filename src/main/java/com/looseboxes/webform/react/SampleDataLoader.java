package com.looseboxes.webform.react;

import com.bc.jpa.spring.repository.EntityRepository;
import com.bc.jpa.spring.repository.EntityRepositoryFactory;
import com.looseboxes.webform.react.domain.BlogSubtype;
import com.looseboxes.webform.react.domain.BlogType;
import com.looseboxes.webform.util.PrintAppInfo;
import java.util.Arrays;
import java.util.concurrent.ThreadLocalRandom;
import javax.persistence.EntityManagerFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

/**
 * @author hp
 */
public class SampleDataLoader extends PrintAppInfo{

    private static final Logger LOG = LoggerFactory.getLogger(SampleDataLoader.class);
    
    private final boolean productionEnvironment;
    
    public SampleDataLoader(ApplicationContext context) {
        super(context);
        final String [] activeProfiles = context.getEnvironment().getActiveProfiles();
        this.productionEnvironment = activeProfiles == null || activeProfiles.length == 0 ? false :
                Arrays.asList(activeProfiles).stream()
                .filter((profile) -> profile.toLowerCase().contains("prod"))
                .findAny().isPresent();
        LOG.info("Active profiles: {}", 
                activeProfiles == null ? null : Arrays.toString(activeProfiles));
    }
    
    @Override
    public void run(String... args) {
        
        this.loadDefaultData();
        
        if( ! this.isProductionEnvironment()) {
            
            this.loadDevData();

            super.run();
        }
    }
    
    public void loadDefaultData() {
        final int subTypesPerType = 300;
        final BlogType [] blogTypes = BlogType.values();
        final EntityRepository repo = this.getEntityRepositoryFactory().forEntity(BlogSubtype.class);
        for(BlogType type : blogTypes) {
            for(int i=0; i<subTypesPerType; i++) {
                final BlogSubtype subType = new BlogSubtype();
                subType.setType(type);
                subType.setName(type + " sub type " + i);
                repo.create(subType);
                LOG.trace("Created: {}", subType);
            }
        }
    }
    
    public void loadDevData() {
        
        if(this.isProductionEnvironment()) {
            throw new UnsupportedOperationException();
        }
    }
    
    public void persist(Object entity) {
        final Class entityType = entity.getClass();
        final EntityRepository repo = getEntityRepositoryFactory().forEntity(entityType);
        repo.create(entity);
//        final Object id = repo.getIdOptional(entity).orElse(null);
        LOG.debug("Persisted: {}", entity);
    }
    
    private String getLogoLink() {
        final String serverPort = this.getContext()
                .getEnvironment().getProperty("server.port", "8080");
        return "http://localhost:"+serverPort+"/logo.jpg";
    }
    
    private int pos(int index, int size) {
        int pos = index % size;
        if(pos == size) {
            pos = size - 1;
        }
        return pos;
    }
    
    private <T> T randomElement(T...arr) {
        return arr[randomNumber(arr.length)];
    }
    
    private int randomNumber(int len) {
        return ThreadLocalRandom.current().nextInt(len);
    }

    public EntityManagerFactory getEntityManagerFactory() {
        final EntityManagerFactory emf = getContext().getBean(EntityManagerFactory.class);
        return emf;
    }
    
    public EntityRepositoryFactory getEntityRepositoryFactory() {
        final EntityRepositoryFactory repoFactory = 
                this.getContext().getBean(EntityRepositoryFactory.class);
        return repoFactory;
    }

    public boolean isProductionEnvironment() {
        return productionEnvironment;
    }
}
