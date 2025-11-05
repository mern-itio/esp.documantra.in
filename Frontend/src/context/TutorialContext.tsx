import React, { createContext, useContext, useState, useEffect } from 'react';

interface TutorialContextType {
  showTutorial: boolean;
  tutorialStep: number;
  setShowTutorial: (show: boolean) => void;
  setTutorialStep: (step: number) => void;
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleCloseTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    setTutorialStep(0);
    localStorage.removeItem('tutorialState');
  };

  const handleNextStep = () => {
    setTutorialStep((prev) => prev + 1);

    if(tutorialStep ===8){
      setShowTutorial(false);
    }
  };

  const handlePrevStep = () => {
    setTutorialStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  // Check for saved tutorial state on mount
  useEffect(() => {
    const tutorialState = localStorage.getItem('tutorialState');
    if (tutorialState) {
      const { inProgress, currentStep } = JSON.parse(tutorialState);
      if (inProgress) {
        setShowTutorial(true);
        setTutorialStep(currentStep);
      }
    }
  }, []);

  const value = {
    showTutorial,
    tutorialStep,
    setShowTutorial,
    setTutorialStep,
    handleNextStep,
    handlePrevStep,
    handleCloseTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};