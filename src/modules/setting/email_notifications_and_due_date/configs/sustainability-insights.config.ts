export const fuelConsumptionWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Energy"
    ],
    "filters": {
      "kpi": [],
      "category": [
          "Fuel Consumption"
      ],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const electricityConsumptionWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Energy"
    ],
    "filters": {
      "kpi": [],
      "category": [
          "Electricity Consumption"
      ],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const energyConsumptionWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Energy"
    ],
    "filters": {
      "kpi": [],
      "category": [
          "Energy Consumption"
      ],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "sub_category"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const emissionsWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Emission"
    ],
    "filters": {
      "kpi": [],
      "category": [
          "Emission"
      ],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "sub_category"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const waterConsumptionWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Water"
    ],
    "filters": {
      "kpi": [],
      "category": [
          "Consumption"
      ],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const waterLifecycleWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Water"
    ],
    "filters": {
      "kpi": [],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "category"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const wasteGeneratedWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Waste"
    ],
    "filters": {
      "kpi": [],
      "category": ["Waste"],
      "location_id": [],
      "sub_category": ["Generated"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const biomedicalWasteGeneratedWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Waste"
    ],
    "filters": {
      "kpi": [],
      "category": [],
      "location_id": [],
      "sub_category": ["Bio-Medical Waste"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const hazardousWasteGeneratedWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Waste"
    ],
    "filters": {
      "kpi": [],
      "category": [],
      "location_id": [],
      "sub_category": ["Hazardous Waste"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const nonHazardousWasteGeneratedWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Waste"
    ],
    "filters": {
      "kpi": [],
      "category": [],
      "location_id": [],
      "sub_category": ["Non-Hazardous Waste"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const genderDiversityWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Diversity"
    ],
    "filters": {
      "kpi": ["Male", "Female", "Others"],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const manipalGenderDiversityWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Diversity"
    ],
    "filters": {
      "kpi": ["Male", "Female"],
      "category": [],
      "location_id": [],
      "sub_category": ["Current employees (in %)"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "avg": "value"
    }
  }
};

export const manipalAgeDiversityWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Diversity"
    ],
    "filters": {
      "kpi": ["< 30 yrs", "30–50 yrs", "> 50 yrs"],
      "category": [],
      "location_id": [],
      "sub_category": ["Current employees (in %)"],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "avg": "value"
    }
  }
};

export const employmentWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Employment"
    ],
    "filters": {
      "kpi": ["Full-time Employees", "Contract Employees", "Outsource Employees"],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const occupancyWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Occupancy"
    ],
    "filters": {
      "kpi": ["Number of IP days", "Total approved beds", "Total operating beds"],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const healthAndSafetyWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Health & Safety"
    ],
    "filters": {
      "kpi": [],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

export const trainingWidget = (displayPeriods: string[], financialYears: string[]) => {
  return {
    "sort": {
      "field": "period",
      "order": "asc"
    },
    "module": [
      "Training"
    ],
    "filters": {
      "kpi": ["Mock Drills", "Fire Safety Audits", "Safety Trainings", "Safety Committee Meetings"],
      "category": [],
      "location_id": [],
      "sub_category": [],
      "displayPeriods": displayPeriods,
      "financial_year": financialYears
    },
    "group_by": [
      "displayPeriods",
      "kpi"
    ],
    "aggregate": {
      "sum": "value"
    }
  }
};

const sustainabilityWidgets = {
  fuelConsumption: { 
    name: 'Fuel Consumption',        
    buildWidget: fuelConsumptionWidget,
    type: "line",
    cidFilename: 'fuel-consumption-chart.png',
    cid: 'fuelConsumptionChart'
  },
  electricity: { 
    name: 'Electricity Consumption', 
    buildWidget: electricityConsumptionWidget,
    type: "line",
    cidFilename: 'electricity-consumption-chart.png',
    cid: 'electricityConsumptionChart'
  },
  energy: { 
    name: 'Energy Consumption',      
    buildWidget: energyConsumptionWidget,
    type: "line",
    cidFilename: 'energy-consumption-chart.png',
    cid: 'energyConsumptionChart'
  },
  emissions: { 
    name: 'Emissions',               
    buildWidget: emissionsWidget,
    type: "line",
    cidFilename: 'emission-chart.png',
    cid: 'emissionChart'
  },
  waterConsumption: { 
    name: 'Water Consumption',       
    buildWidget: waterConsumptionWidget,
    type: "line",
    cidFilename: 'water-consumption-chart.png',
    cid: 'waterConsumptionChart'
  },
  waterLifecycle: { 
    name: 'Water Lifecycle',         
    buildWidget: waterLifecycleWidget,
    type: "line",
    cidFilename: 'water-lifecycle-chart.png',
    cid: 'waterLifecycleChart'
  },
  wasteGenerated: { 
    name: 'Waste Generated',         
    buildWidget: wasteGeneratedWidget,
    type: "line",
    cidFilename: 'waste-generated-chart.png',
    cid: 'wasteGeneratedChart'
  },
  biomedicalWasteGenerated: { 
    name: 'Biomedical Waste Generated',         
    buildWidget: biomedicalWasteGeneratedWidget,
    type: "line",
    cidFilename: 'bio-medical-waste-generated-chart.png',
    cid: 'biomedicalWasteGeneratedChart'
  },
  hazardousWasteGenerated: { 
    name: 'Hazardous Waste Generated',
    buildWidget: hazardousWasteGeneratedWidget,
    type: "line",
    cidFilename: 'hazardous-waste-generated-chart.png',
    cid: 'hazardousWasteGeneratedChart'
  },
  nonHazardousWasteGenerated: { 
    name: 'Non-Hazardous Waste Generated',
    buildWidget: nonHazardousWasteGeneratedWidget,
    type: "line",
    cidFilename: 'non-hazardous-waste-generated-chart.png',
    cid: 'nonHazardousWasteGeneratedChart'
  },
  genderDiversity: { 
    name: 'Gender Diversity',        
    buildWidget: genderDiversityWidget,
    type: "line",
    cidFilename: 'gender-diversity-chart.png',
    cid: 'genderDiversityChart'
  },
  manipalGenderDiversity: { 
    name: 'Gender Diversity',        
    buildWidget: manipalGenderDiversityWidget,
    type: "line",
    cidFilename: 'manipal-gender-diversity-chart.png',
    cid: 'manipalGenderDiversityChart'
  },
  manipalAgeDiversity: { 
    name: 'Age Diversity',           
    buildWidget: manipalAgeDiversityWidget,
    type: "line",
    cidFilename: 'manipal-age-diversity-chart.png',
    cid: 'manipalAgeDiversityChart'
  },
  employment: { 
    name: 'Employment',              
    buildWidget: employmentWidget,
    type: "line",
    cidFilename: 'employment-chart.png',
    cid: 'employmentChart'
  },
  occupancy: { 
    name: 'Occupancy',               
    buildWidget: occupancyWidget,
    type: "line",
    cidFilename: 'occupancy-chart.png',
    cid: 'occupancyChart'
  },
  healthAndSafety: { 
    name: 'Health & Safety',        
    buildWidget: healthAndSafetyWidget,
    type: "line",
    cidFilename: 'health-and-safety-chart.png',
    cid: 'healthAndSafetyChart'
  },
  training: { 
    name: 'Training',                
    buildWidget: trainingWidget,
    type: "line",
    cidFilename: 'training-chart.png',
    cid: 'trainingChart'
  },
};

export const getSustainabilityInsightWidgets = (frameworkId) => {
  switch (frameworkId) {
    case 1:
      return [
        sustainabilityWidgets.fuelConsumption,
        sustainabilityWidgets.electricity,
        sustainabilityWidgets.energy,
        sustainabilityWidgets.emissions,
        sustainabilityWidgets.waterConsumption,
        sustainabilityWidgets.waterLifecycle,
        sustainabilityWidgets.wasteGenerated,
        sustainabilityWidgets.genderDiversity,
      ];

    case 48:
      return [
        sustainabilityWidgets.fuelConsumption,
        sustainabilityWidgets.electricity,
        sustainabilityWidgets.energy,
        sustainabilityWidgets.emissions,
        sustainabilityWidgets.waterConsumption,
        sustainabilityWidgets.waterLifecycle,
        sustainabilityWidgets.biomedicalWasteGenerated,
        sustainabilityWidgets.hazardousWasteGenerated,
        sustainabilityWidgets.nonHazardousWasteGenerated,
        // TODO: Remove gender/age diversity as weighted average is not supported yet
        // sustainabilityWidgets.manipalGenderDiversity,
        // sustainabilityWidgets.manipalAgeDiversity,
        sustainabilityWidgets.employment,
        sustainabilityWidgets.occupancy,
        sustainabilityWidgets.healthAndSafety,
        sustainabilityWidgets.training,
      ];

    default:
      return [
        sustainabilityWidgets.fuelConsumption,
        sustainabilityWidgets.electricity,
        sustainabilityWidgets.energy,
        sustainabilityWidgets.emissions,
        sustainabilityWidgets.waterConsumption,
        sustainabilityWidgets.waterLifecycle,
        sustainabilityWidgets.wasteGenerated,
        sustainabilityWidgets.genderDiversity,
      ];
  }
};
