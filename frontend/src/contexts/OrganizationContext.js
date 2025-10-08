import React, { createContext, useState, useContext, useEffect } from 'react';
import { organizationAPI, featureFlagsAPI } from '../services/api';
import { useAuth } from './AuthContext';

const OrganizationContext = createContext();

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadOrganization();
      loadFeatures();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrganization = async () => {
    try {
      const response = await organizationAPI.get();
      setOrganization(response.data.organization);
    } catch (error) {
      console.error('Failed to load organization:', error);
    }
  };

  const loadFeatures = async () => {
    try {
      const response = await featureFlagsAPI.getAll();
      setFeatures(response.data.features);
    } catch (error) {
      console.error('Failed to load features:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (data) => {
    await organizationAPI.update(data);
    await loadOrganization();
  };

  const isFeatureEnabled = (featureName) => {
    return features[featureName] === true;
  };

  const value = {
    organization,
    features,
    loading,
    updateOrganization,
    isFeatureEnabled,
    loadOrganization,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};