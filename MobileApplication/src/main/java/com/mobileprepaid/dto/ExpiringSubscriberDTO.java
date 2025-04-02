package com.mobileprepaid.dto;

public class ExpiringSubscriberDTO {
    private String name;
    private String phone;
    private String email;
    private String plan;
    private Double price;
    private String validity;
    private String rechargeDate;
    private String expiryDate;

    public ExpiringSubscriberDTO(String name, String phone, String email, String plan, Double price, String validity, String rechargeDate, String expiryDate) {
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.plan = plan;
        this.price = price;
        this.validity = validity;
        this.rechargeDate = rechargeDate;
        this.expiryDate = expiryDate;
    }

    // Getters and setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getValidity() { return validity; }
    public void setValidity(String validity) { this.validity = validity; }
    public String getRechargeDate() { return rechargeDate; }
    public void setRechargeDate(String rechargeDate) { this.rechargeDate = rechargeDate; }
    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }
}