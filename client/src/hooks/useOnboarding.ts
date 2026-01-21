import { useState, useEffect } from "react";

interface OnboardingState {
  hasSeenTour: boolean;
  tourCompleted: boolean;
  currentStep: number;
}

const STORAGE_KEY = 'eatoff-onboarding';

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {
        hasSeenTour: false,
        tourCompleted: false,
        currentStep: 0
      };
    } catch {
      return {
        hasSeenTour: false,
        tourCompleted: false,
        currentStep: 0
      };
    }
  });

  const [showTour, setShowTour] = useState(false);
  const [tourType, setTourType] = useState<'user' | 'restaurant'>('user');

  useEffect(() => {
    // Check if user should see the tour on mount
    if (!state.hasSeenTour && !state.tourCompleted) {
      // Delay showing tour slightly to let page load
      const timer = setTimeout(() => {
        setShowTour(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state.hasSeenTour, state.tourCompleted]);

  const updateState = (updates: Partial<OnboardingState>) => {
    const newState = { ...state, ...updates };
    setState(newState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const startTour = (type: 'user' | 'restaurant' = 'user') => {
    console.log("useOnboarding.startTour called, setting showTour to true");
    setTourType(type);
    setShowTour(true);
    updateState({ hasSeenTour: true, currentStep: 0 });
    console.log("useOnboarding state after startTour:", { showTour: true, hasSeenTour: true });
  };

  const startUserTour = () => {
    startTour('user');
    // Scroll to top when starting tour
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };
  
  const startRestaurantTour = () => {
    startTour('restaurant');
    // Scroll to top when starting tour
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const completeTour = () => {
    setShowTour(false);
    updateState({ tourCompleted: true });
  };

  const closeTour = () => {
    setShowTour(false);
    updateState({ hasSeenTour: true });
  };

  const resetTour = () => {
    updateState({ 
      hasSeenTour: false, 
      tourCompleted: false, 
      currentStep: 0 
    });
    localStorage.removeItem(STORAGE_KEY);
  };

  const shouldShowTourButton = !state.tourCompleted;

  return {
    showTour,
    hasSeenTour: state.hasSeenTour,
    tourCompleted: state.tourCompleted,
    shouldShowTourButton,
    tourType,
    startTour,
    startUserTour,
    startRestaurantTour,
    completeTour,
    closeTour,
    resetTour
  };
}