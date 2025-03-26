import { useState, useEffect } from 'react';

/**
 * Custom hook for managing model settings
 * @returns {Object} Model settings state and actions
 */
export const useModelSettings = () => {
  // Define available models
  const [fineTuningModels, setFineTuningModels] = useState([
    { id: 'gpt-4o', label: 'GPT-4o', description: 'Most capable, best for complex tasks' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast and cost-effective', default: true },
    { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Good balance of speed and quality' }
  ]);
  
  const [salesCopyModels, setSalesCopyModels] = useState([
    { id: 'claude-3-opus-20240229', label: 'Claude 3 Opus', description: 'Most capable, best quality', default: true },
    { id: 'claude-3-sonnet-20240307', label: 'Claude 3 Sonnet', description: 'Good balance of quality and speed' },
    { id: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', description: 'Fastest, most cost-effective' }
  ]);
  
  // Initialize state from localStorage or defaults
  const [selectedFineTuner, setSelectedFineTuner] = useState(() => {
    try {
      const saved = localStorage.getItem('fineTuningModel');
      if (saved) return saved;
      
      const defaultModel = fineTuningModels.find(m => m.default);
      return defaultModel ? defaultModel.id : fineTuningModels[0].id;
    } catch (err) {
      console.warn('Error loading fine-tuning model from localStorage:', err);
      return 'gpt-4o-mini';
    }
  });
  
  const [selectedSalesCopy, setSelectedSalesCopy] = useState(() => {
    try {
      const saved = localStorage.getItem('salesCopyModel');
      if (saved) return saved;
      
      const defaultModel = salesCopyModels.find(m => m.default);
      return defaultModel ? defaultModel.id : salesCopyModels[0].id;
    } catch (err) {
      console.warn('Error loading sales copy model from localStorage:', err);
      return 'claude-3-opus-20240229';
    }
  });

  // Save selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('fineTuningModel', selectedFineTuner);
  }, [selectedFineTuner]);

  useEffect(() => {
    localStorage.setItem('salesCopyModel', selectedSalesCopy);
  }, [selectedSalesCopy]);

  // Function to get current model options
  const getModelOptions = () => {
    return {
      fineTuningModel: selectedFineTuner,
      salesCopyModel: selectedSalesCopy
    };
  };

  return {
    fineTuningModels,
    salesCopyModels,
    selectedFineTuner,
    selectedSalesCopy,
    setSelectedFineTuner,
    setSelectedSalesCopy,
    getModelOptions
  };
};

export default useModelSettings;