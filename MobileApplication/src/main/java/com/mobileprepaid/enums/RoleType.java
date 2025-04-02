package com.mobileprepaid.enums;

public enum RoleType {
    ADMIN,      
    SUBSCRIBER;

    @Override
    public String toString() {
        return name().toUpperCase();
    }
}
