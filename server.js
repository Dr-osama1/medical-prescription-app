const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');

const ensureDataFile = (fileName, defaultData) => {
  const filePath = path.join(DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

const loadJson = (fileName) => {
  const filePath = path.join(DATA_DIR, fileName);
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
};

const saveJson = (fileName, data) => {
  const filePath = path.join(DATA_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const calculateDose = (medicine, patient) => {
  const weight = Number(patient.weightKg || 0);
  const age = Number(patient.age || 0);

  let recommendedDose = 0;
  if (medicine.standardDosePerKg && medicine.standardDosePerKg > 0) {
    if (medicine.unit.includes('mg/kg/day')) {
      recommendedDose = medicine.standardDosePerKg * weight;
    } else if (medicine.unit.includes('mg/kg/dose')) {
      recommendedDose = medicine.standardDosePerKg * weight;
    } else if (medicine.unit.includes('mg/day')) {
      recommendedDose = Number(medicine.standardDosePerKg);
    }
  }

  const warnings = [];

  if (medicine.minAge && age < medicine.minAge) {
    warnings.push(`Age below recommended minimum of ${medicine.minAge} years for ${medicine.name}.`);
  }

  if (medicine.maxDailyDose && recommendedDose > medicine.maxDailyDose) {
    warnings.push(`Suggested dose exceeds the maximum daily dose for ${medicine.name}.`);
  }

  if (medicine.maxSingleDose && recommendedDose > medicine.maxSingleDose) {
    warnings.push(`Suggested single dose exceeds the single-dose maximum for ${medicine.name}.`);
  }

  if (patient.allergies && patient.allergies.toLowerCase().includes('penicillin') && medicine.name.toLowerCase().includes('amoxicillin')) {
    warnings.push('Patient allergy warning: penicillin allergy detected.');
  }

  if (warnings.length === 0) {
    warnings.push('Dose is within the typical reference range.');
  }

  return {
    medicineName: medicine.name,
    weightKg: weight,
    age,
    recommendedDose,
    unit: medicine.unit,
    warnings,
    safe: warnings.every((warning) => !warning.includes('exceeds') && !warning.includes('below recommended minimum'))
  };
};

ensureDataFile('medicines.json', {
  medicines: [
    {
      id: 'amoxicillin-500',
      name: 'Amoxicillin',
      brand: 'Amoxicillin 500mg Capsule',
      strength: '500 mg',
      form: 'Capsule',
      route: 'Oral',
      standardDosePerKg: 20,
      unit: 'mg/kg/day',
      maxDailyDose: 1000,
      maxSingleDose: 500,
      minAge: 0,
      category: 'Antibiotic',
      notes: 'General pediatric antibiotic reference. Confirm against local protocol.',
      contraindications: ['Penicillin allergy']
    },
    {
      id: 'paracetamol-500',
      name: 'Paracetamol',
      brand: 'Paracetamol 500mg Tablet',
      strength: '500 mg',
      form: 'Tablet',
      route: 'Oral',
      standardDosePerKg: 15,
      unit: 'mg/kg/dose',
      maxDailyDose: 4000,
      maxSingleDose: 1000,
      minAge: 0,
      category: 'Analgesic',
      notes: 'Typical pain/fever dosing. Check liver disease and total daily dose.',
      contraindications: ['Severe hepatic impairment']
    },
    {
      id: 'ibuprofen-200',
      name: 'Ibuprofen',
      brand: 'Ibuprofen 200mg Tablet',
      strength: '200 mg',
      form: 'Tablet',
      route: 'Oral',
      standardDosePerKg: 10,
      unit: 'mg/kg/dose',
      maxDailyDose: 2400,
      maxSingleDose: 800,
      minAge: 6,
      category: 'NSAID',
      notes: 'Dose may be adjusted for renal risk or GI risk.',
      contraindications: ['Peptic ulcer', 'Kidney disease']
    },
    {
      id: 'cefalexin-500',
      name: 'Cefalexin',
      brand: 'Cefalexin 500mg Capsule',
      strength: '500 mg',
      form: 'Capsule',
      route: 'Oral',
      standardDosePerKg: 25,
      unit: 'mg/kg/day',
      maxDailyDose: 1500,
      maxSingleDose: 500,
      minAge: 1,
      category: 'Antibiotic',
      notes: 'Common first-line antibiotic reference. Local prescribing guidance should be followed.',
      contraindications: ['Cephalosporin allergy']
    },
    {
      id: 'omeprazole-20',
      name: 'Omeprazole',
      brand: 'Omeprazole 20mg Tablet',
      strength: '20 mg',
      form: 'Tablet',
      route: 'Oral',
      standardDosePerKg: 1,
      unit: 'mg/kg/day',
      maxDailyDose: 40,
      maxSingleDose: 20,
      minAge: 1,
      category: 'PPI',
      notes: 'Acid suppression reference. Adjust according to indication and local guideline.',
      contraindications: ['Severe magnesium deficiency']
    },
    {
      id: 'metformin-500',
      name: 'Metformin',
      brand: 'Metformin 500mg Tablet',
      strength: '500 mg',
      form: 'Tablet',
      route: 'Oral',
      standardDosePerKg: 500,
      unit: 'mg/day',
      maxDailyDose: 2000,
      maxSingleDose: 500,
      minAge: 10,
      category: 'Antidiabetic',
      notes: 'General glucose-lowering reference. Renal function must be considered.',
      contraindications: ['Severe renal impairment']
    }
  ]
});

ensureDataFile('patients.json', [
  {
    id: 1,
    name: 'Ahmed Ali',
    age: 28,
    weightKg: 70,
    allergies: 'None known',
    notes: 'No significant medical history'
  },
  {
    id: 2,
    name: 'Sara Salem',
    age: 12,
    weightKg: 35,
    allergies: 'Penicillin allergy',
    notes: 'Pediatric patient under supervision'
  }
]);

ensureDataFile('prescriptions.json', [
  {
    id: 1,
    patientId: 1,
    patientName: 'Ahmed Ali',
    medicineName: 'Paracetamol',
    dose: 1050,
    doseUnit: 'mg',
    frequency: 'Every 6 hours',
    durationDays: 3,
    date: '2026-10-07',
    warnings: ['Dose is within the typical reference range.']
  }
]);

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/api/medicines', (req, res) => {
  const data = loadJson('medicines.json');
  res.json(data.medicines || []);
});

app.get('/api/patients', (req, res) => {
  const patients = loadJson('patients.json');
  res.json(patients);
});

app.get('/api/prescriptions', (req, res) => {
  const prescriptions = loadJson('prescriptions.json');
  res.json(prescriptions);
});

app.post('/api/patients', (req, res) => {
  const patients = loadJson('patients.json');
  const { name, age, weightKg, allergies, notes } = req.body;

  if (!name || !age || !weightKg) {
    return res.status(400).json({ error: 'Name, age, and weight are required.' });
  }

  const newPatient = {
    id: Date.now(),
    name,
    age: Number(age),
    weightKg: Number(weightKg),
    allergies: allergies || 'None known',
    notes: notes || ''
  };

  patients.push(newPatient);
  saveJson('patients.json', patients);
  res.status(201).json(newPatient);
});

app.post('/api/calculate-dose', (req, res) => {
  const { medicineId, patientId } = req.body;
  const medicines = loadJson('medicines.json').medicines;
  const patients = loadJson('patients.json');

  const medicine = medicines.find((item) => item.id === medicineId);
  const patient = patients.find((item) => Number(item.id) === Number(patientId));

  if (!medicine || !patient) {
    return res.status(404).json({ error: 'Medicine or patient not found.' });
  }

  const result = calculateDose(medicine, patient);
  res.json(result);
});

app.post('/api/prescriptions', (req, res) => {
  const prescriptions = loadJson('prescriptions.json');
  const patients = loadJson('patients.json');
  const medicineCatalog = loadJson('medicines.json').medicines;

  const { patientId, medicineId, frequency, durationDays } = req.body;

  const patient = patients.find((item) => Number(item.id) === Number(patientId));
  const medicine = medicineCatalog.find((item) => item.id === medicineId);

  if (!patient || !medicine) {
    return res.status(404).json({ error: 'Patient or medicine not found.' });
  }

  const calculation = calculateDose(medicine, patient);
  const newPrescription = {
    id: Date.now(),
    patientId: patient.id,
    patientName: patient.name,
    medicineName: medicine.name,
    dose: Math.round(calculation.recommendedDose),
    doseUnit: 'mg',
    frequency: frequency || 'Daily',
    durationDays: Number(durationDays) || 3,
    date: new Date().toISOString().slice(0, 10),
    warnings: calculation.warnings
  };

  prescriptions.unshift(newPrescription);
  saveJson('prescriptions.json', prescriptions);
  res.status(201).json(newPrescription);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Medical Prescription App running at http://localhost:${PORT}`);
});
