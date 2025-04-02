package com.mobileprepaid.repository;

import com.mobileprepaid.entities.Plan;
import com.mobileprepaid.enums.PlanStatus;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanRepository extends JpaRepository<Plan, Long>, JpaSpecificationExecutor<Plan> {


	Page<Plan> findAll(Pageable pageable);

	Page<Plan> findByStatus(PlanStatus status, Pageable pageable);


    Page<Plan> findByNameContainingIgnoreCaseAndStatus(String name, PlanStatus status, Pageable pageable);


    Page<Plan> findByCategoryNameAndStatus(String category, PlanStatus status, Pageable pageable);

    Page<Plan> findByDataLimitContainingIgnoreCaseAndStatus(String dataLimit, PlanStatus status, Pageable pageable);


    Page<Plan> findByValidityAndStatus(Integer validity, PlanStatus status, Pageable pageable);

    Page<Plan> findByStatusOrderByPriceAsc(PlanStatus status, Pageable pageable);
    long countByStatus(PlanStatus status);
    Page<Plan> findByStatusOrderByPriceDesc(PlanStatus status, Pageable pageable);
    
    
}
