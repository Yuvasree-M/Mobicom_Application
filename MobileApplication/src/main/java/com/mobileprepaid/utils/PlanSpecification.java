package com.mobileprepaid.utils;

import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.enums.PlanStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

public class PlanSpecification {
    public static Specification<Plan> filterPlans(String name, String category, String dataLimit, Integer validity) {
        return (root, query, criteriaBuilder) -> {
            Predicate predicate = criteriaBuilder.conjunction();

         
            if (name != null && !name.isEmpty()) {
                predicate = criteriaBuilder.and(predicate, 
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }

            if (category != null && !category.isEmpty()) {
                predicate = criteriaBuilder.and(predicate, 
                    criteriaBuilder.like(criteriaBuilder.lower(root.join("category").get("name")), "%" + category.toLowerCase() + "%"));
            }

            if (dataLimit != null && !dataLimit.isEmpty()) {
                predicate = criteriaBuilder.and(predicate, 
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("dataLimit")), "%" + dataLimit.toLowerCase() + "%"));
            }

            if (validity != null) {
                predicate = criteriaBuilder.and(predicate, 
                    criteriaBuilder.equal(root.get("validity"), validity));
            }

            predicate = criteriaBuilder.and(predicate, 
                criteriaBuilder.equal(root.get("status"), PlanStatus.ACTIVE));

            return predicate;
        };
    }
}